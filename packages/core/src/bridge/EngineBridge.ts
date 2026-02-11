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
 */
export class EngineBridge implements IEngineBridge {
  /**
   * 登録されたアダプターのマップ。
   * 内部管理用として意図的に any を許容するインターフェースで保持します。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private adapters = new Map<string, IEngineAdapter<any, any, any>>();
  
  /** ミドルウェアのリスト。内部的には any を許容します。 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private middlewares: IMiddleware<any, any>[] = [];
  
  /** 作成済み Facade のキャッシュ（排他制御の状態を維持するため） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private facades = new Map<string, EngineFacade<any, any, any>>();

  /** アダプターごとのイベント購読解除関数リスト */
  private adapterUnsubscribers = new Map<string, (() => void)[]>();

  /** 非同期で初期化されるリソースローダーの Promise */
  private loaderPromise: Promise<EngineLoader> | null = null;

  // グローバルイベントリスナーのセット
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
          this.loaderPromise = null;
          throw err;
        }
      })();
    }
    return this.loaderPromise;
  }

  /**
   * エンジンアダプターをブリッジに登録します。
   */
  registerAdapter<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>): void {
    const id = adapter.id;

    if (this.adapters.has(id)) {
      console.warn(`Adapter with ID "${id}" is already registered. Overwriting.`);
      const oldUnsubs = this.adapterUnsubscribers.get(id);
      oldUnsubs?.forEach(unsub => unsub());
      this.adapterUnsubscribers.delete(id);
      this.facades.delete(id);
    }

    const unsubscribers: (() => void)[] = [];
    
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
   * 指定されたエンジンIDに対応する利用者向け Facade を取得します。
   */
  getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(id: string): IEngine<T_OPTIONS, T_INFO, T_RESULT> {
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
   * ブリッジ全体に適用するミドルウェアを追加します。
   */
  use<T_INFO = unknown, T_RESULT = unknown>(middleware: IMiddleware<T_INFO, T_RESULT>): void {
    this.middlewares.push(middleware);
    // 新しいミドルウェア構成を反映させるため、既存の Facade キャッシュをクリア
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
