import {
  IEngineBridge,
  IEngineAdapter,
  IEngine,
  IMiddleware,
  ICapabilities,
  ISecurityStatus,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  MiddlewarePriority,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  EngineErrorCode,
  IEngineLoader,
} from "../types";
import { EngineFacade } from "./EngineFacade";
import { CapabilityDetector } from "../capabilities/CapabilityDetector";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor";
import { EngineLoader } from "./EngineLoader";
import { createFileStorage } from "../storage";
import { EngineError } from "../errors/EngineError";

/**
 * 複数のエンジンアダプターを集中管理するブリッジクラス。
 * 
 * 2026年最新のベストプラクティスに基づき、
 * リソース管理、イベント集約、ミドルウェアチェーンを統合します。
 */
export class EngineBridge implements IEngineBridge {
  /**
   * 登録されたアダプターのマップ。
   * ジェネリクスが多様なため内部管理用として any を使用。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private adapters = new Map<string, IEngineAdapter<any, any, any>>();
  
  /** ミドルウェアのリスト。内部的には any を許容。 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private middlewares: IMiddleware<any, any>[] = [];
  
  /** Facade インスタンスのキャッシュ（排他制御の状態を維持するため） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private facades = new Map<string, EngineFacade<any, any, any>>();

  /** アダプターごとのイベント購読解除関数を保持 */
  private adapterUnsubscribers = new Map<string, (() => void)[]>();

  /** 非同期で初期化されるリソースローダーの Promise */
  private loaderPromise: Promise<EngineLoader> | null = null;

  // グローバルイベントリスナー
  private statusListeners = new Set<(id: string, status: EngineStatus) => void>();
  private progressListeners = new Set<(id: string, progress: ILoadProgress) => void>();
  private telemetryListeners = new Set<(id: string, event: ITelemetryEvent) => void>();

  /**
   * 環境に適した EngineLoader を非同期で取得します。
   */
  async getLoader(): Promise<IEngineLoader> {
    if (!this.loaderPromise) {
      this.loaderPromise = (async () => {
        try {
          const caps = await this.checkCapabilities();
          const storage = createFileStorage(caps);
          return new EngineLoader(storage);
        } catch (err) {
          // 初期化失敗時はキャッシュをクリアし、次回の呼び出しで再試行を可能にする
          this.loaderPromise = null;
          throw err;
        }
      })();
    }
    return this.loaderPromise;
  }

  /**
   * アダプターを登録します。既存の登録がある場合は購読を解除して上書きします。
   */
  registerAdapter<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>): void {
    const id = adapter.id;

    if (this.adapters.has(id)) {
      console.warn(`[EngineBridge] Adapter "${id}" is already registered. Re-registering...`);
      // 古い購読を解除してリークを防止
      const oldUnsubs = this.adapterUnsubscribers.get(id);
      oldUnsubs?.forEach(unsub => unsub());
      this.adapterUnsubscribers.delete(id);
      // アダプターが新しくなるためキャッシュされた Facade もクリア
      this.facades.delete(id);
    }

    const unsubscribers: (() => void)[] = [];
    
    // イベントのバブリング（集約）設定
    unsubscribers.push(adapter.onStatusChange((status) => {
      this.statusListeners.forEach(cb => cb(id, status));
    }));
    
    unsubscribers.push(adapter.onProgress((progress) => {
      this.progressListeners.forEach(cb => cb(id, progress));
    }));
    
    if (adapter.onTelemetry) {
      unsubscribers.push(adapter.onTelemetry((event) => {
        this.telemetryListeners.forEach(cb => cb(id, event));
      }));
    }

    this.adapterUnsubscribers.set(id, unsubscribers);
    this.adapters.set(id, adapter);
  }

  /**
   * 指定されたエンジンの Facade を取得します。
   */
  getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(id: string): IEngine<T_OPTIONS, T_INFO, T_RESULT> {
    // 同一IDに対しては常に同じインスタンスを返し、タスクの状態を共有する
    if (this.facades.has(id)) {
      return this.facades.get(id) as unknown as IEngine<T_OPTIONS, T_INFO, T_RESULT>;
    }

    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, `Engine "${id}" not found.`);
    }

    const sortedMiddlewares = [...this.middlewares].sort(
      (a, b) => (b.priority ?? MiddlewarePriority.NORMAL) - (a.priority ?? MiddlewarePriority.NORMAL)
    );

    const facade = new EngineFacade<T_OPTIONS, T_INFO, T_RESULT>(adapter, sortedMiddlewares, this);
    this.facades.set(id, facade);
    
    return facade;
  }

  /**
   * ミドルウェアを追加します。既存の Facade キャッシュをクリアして反映を保証します。
   */
  use<T_INFO = unknown, T_RESULT = unknown>(middleware: IMiddleware<T_INFO, T_RESULT>): void {
    this.middlewares.push(middleware);
    // 新しいミドルウェアを適用するため、作成済みの Facade インスタンスを破棄（再生成）
    this.facades.clear();
  }

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

  async checkCapabilities(): Promise<ICapabilities> {
    return await CapabilityDetector.detect();
  }

  getSecurityStatus(): ISecurityStatus {
    return SecurityAdvisor.getStatus();
  }
}
