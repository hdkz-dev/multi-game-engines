import {
  IEngineBridge,
  IEngineAdapter,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IMiddleware,
  MiddlewarePriority,
  IEngineLoader,
  IEngine,
  ICapabilities,
  EngineErrorCode,
  EngineLoadingStrategy,
} from "../types";
import { EngineFacade } from "./EngineFacade";
import { EngineLoader } from "./EngineLoader";
import { CapabilityDetector } from "../capabilities/CapabilityDetector";
import { createFileStorage } from "../storage";
import { EngineError } from "../errors/EngineError";

/**
 * エンジンブリッジの具象実装。
 * 全てのエンジンのオーケストレーションと共通基盤（ストレージ、ローダー）を提供します。
 */
export class EngineBridge implements IEngineBridge {
  private adapters = new Map<string, IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>>();
  private facades = new Map<string, EngineFacade<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>>();
  private adapterUnsubscribers = new Map<string, (() => void)[]>();
  private middlewares: IMiddleware<unknown, unknown>[] = [];
  
  private statusListeners = new Set<(id: string, status: EngineStatus) => void>();
  private progressListeners = new Set<(id: string, progress: ILoadProgress) => void>();
  private telemetryListeners = new Set<(id: string, event: ITelemetryEvent) => void>();

  private loaderPromise: Promise<IEngineLoader> | null = null;

  /**
   * アダプターを登録します。
   */
  registerAdapter<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>): void {
    // 既存の同一 ID アダプターがある場合は、購読を解除してから上書き
    this.unregisterAdapter(adapter.id);

    // Bridge Pattern: Heterogeneous adapters are stored in a common Map.
    // Casting to base type is safe as it will be re-casted to the requested type in getEngine().
    this.adapters.set(adapter.id, adapter as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    const unsubscribers: (() => void)[] = [];

    // イベントの委譲 (Global Propagation)
    unsubscribers.push(
      adapter.onStatusChange((status) => {
        for (const listener of this.statusListeners) listener(adapter.id, status);
      })
    );

    unsubscribers.push(
      adapter.onProgress((progress) => {
        for (const listener of this.progressListeners) listener(adapter.id, progress);
      })
    );

    if (adapter.onTelemetry) {
      unsubscribers.push(
        adapter.onTelemetry((event) => {
          for (const listener of this.telemetryListeners) listener(adapter.id, event);
        })
      );
    }

    this.adapterUnsubscribers.set(adapter.id, unsubscribers);
  }

  /**
   * アダプターの登録を解除します。
   */
  unregisterAdapter(id: string): void {
    const unsubscribers = this.adapterUnsubscribers.get(id);
    if (unsubscribers) {
      for (const unsub of unsubscribers) unsub();
      this.adapterUnsubscribers.delete(id);
    }
    this.adapters.delete(id);
    this.facades.delete(id);
  }

  /**
   * 実行環境の能力を診断します。
   */
  async checkCapabilities(): Promise<ICapabilities> {
    return CapabilityDetector.detect();
  }

  /**
   * 統合リソースローダーを取得します。
   */
  async getLoader(): Promise<IEngineLoader> {
    if (!this.loaderPromise) {
      this.loaderPromise = (async () => {
        const caps = await this.checkCapabilities();
        const storage = createFileStorage(caps);
        return new EngineLoader(storage);
      })().catch((err) => {
        this.loaderPromise = null;
        throw err;
      });
    }
    return this.loaderPromise;
  }

  /**
   * 指定された ID のエンジン Facade インスタンスを取得します。
   * 2026 Best Practice: EngineRegistry に基づく自動型推論。
   */
  getEngine<K extends keyof import("../types").EngineRegistry>(
    id: K,
    strategy?: EngineLoadingStrategy
  ): IEngine<
    import("../types").EngineRegistry[K]["options"],
    import("../types").EngineRegistry[K]["info"],
    import("../types").EngineRegistry[K]["result"]
  >;
  /**
   * カスタムエンジンを取得します（ジェネリクス指定が必要）。
   */
  getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(id: string, strategy?: EngineLoadingStrategy): IEngine<T_OPTIONS, T_INFO, T_RESULT>;

  getEngine<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(id: string, strategy: EngineLoadingStrategy = "on-demand"): IEngine<T_OPTIONS, T_INFO, T_RESULT> {
    const cached = this.facades.get(id);
    if (cached) {
      const facade = cached as unknown as EngineFacade<T_OPTIONS, T_INFO, T_RESULT>;
      facade.loadingStrategy = strategy;
      if (strategy === "eager" && facade.status === "uninitialized") {
        void facade.load();
      }
      return facade as unknown as IEngine<T_OPTIONS, T_INFO, T_RESULT>;
    }

    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, `Engine "${id}" is not registered.`);
    }

    const sortedMiddlewares = [...this.middlewares].sort(
      (a, b) => (b.priority ?? MiddlewarePriority.NORMAL) - (a.priority ?? MiddlewarePriority.NORMAL)
    );

    // Facade Design Pattern: 内部のアダプターとミドルウェアを隠蔽し、型安全なインターフェースを提供。
    const facade = new EngineFacade<T_OPTIONS, T_INFO, T_RESULT>(
      adapter as unknown as IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
      sortedMiddlewares as unknown as IMiddleware<T_INFO, T_RESULT>[],
      () => this.getLoader(),
      false // ownsAdapter: false (Managed by Bridge)
    );
    
    facade.loadingStrategy = strategy;
    this.facades.set(id, facade as unknown as EngineFacade<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    if (strategy === "eager") {
      void facade.load();
    }
    
    return facade;
  }

  /**
   * グローバルに適用されるミドルウェアを追加します。
   */
  use<T_INFO = unknown, T_RESULT = unknown>(middleware: IMiddleware<T_INFO, T_RESULT>): void {
    this.middlewares.push(middleware);
    this.facades.clear();
  }

  // --- グローバル購読メソッド (2026 Best Practice) ---

  onGlobalStatusChange(callback: (id: string, status: EngineStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onGlobalProgress(callback: (id: string, progress: ILoadProgress) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  onGlobalTelemetry(callback: (id: string, event: ITelemetryEvent) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  /**
   * ブリッジ全体を破棄し、全てのアダプターのリソースを解放します。
   */
  async dispose(): Promise<void> {
    const disposePromises: Promise<void>[] = [];
    for (const adapterId of this.adapters.keys()) {
      const adapter = this.adapters.get(adapterId);
      if (adapter) {
        disposePromises.push(adapter.dispose());
      }
      this.unregisterAdapter(adapterId);
    }
    await Promise.all(disposePromises);
    
    this.adapters.clear();
    this.facades.clear();
    this.statusListeners.clear();
    this.progressListeners.clear();
    this.telemetryListeners.clear();
    this.loaderPromise = null;
  }
}
