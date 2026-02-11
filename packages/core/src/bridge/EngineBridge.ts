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
  private adapters = new Map<string, IEngineAdapter<any, any, any>>();
  private facades = new Map<string, EngineFacade<any, any, any>>();
  private middlewares: IMiddleware<any, any>[] = [];
  
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
    if (this.adapters.has(adapter.id)) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, `Adapter with id "${adapter.id}" is already registered.`);
    }

    this.adapters.set(adapter.id, adapter);

    // イベントの委譲 (Global Propagation)
    adapter.onStatusChange((status) => {
      for (const listener of this.statusListeners) listener(adapter.id, status);
    });

    adapter.onProgress((progress) => {
      for (const listener of this.progressListeners) listener(adapter.id, progress);
    });

    adapter.onTelemetry?.((event) => {
      for (const listener of this.telemetryListeners) listener(adapter.id, event);
    });
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
   */
  getEngine<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(id: string): IEngine<T_OPTIONS, T_INFO, T_RESULT> {
    const cached = this.facades.get(id);
    if (cached) return cached as unknown as IEngine<T_OPTIONS, T_INFO, T_RESULT>;

    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, `Engine "${id}" is not registered.`);
    }

    const sortedMiddlewares = [...this.middlewares].sort(
      (a, b) => (b.priority ?? MiddlewarePriority.NORMAL) - (a.priority ?? MiddlewarePriority.NORMAL)
    );

    const facade = new EngineFacade<T_OPTIONS, T_INFO, T_RESULT>(adapter, sortedMiddlewares);
    this.facades.set(id, facade);
    
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
}
