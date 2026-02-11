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
 * 複数のエンジンアダプターを集中管理する中央ブリッジ。
 * 
 * [設計意図: ADR-001, ADR-019 参照]
 * 1. 疎結合の維持: 利用者は EngineBridge 経由でエンジンを取得し、アダプターの具体的な実装（Worker, WASM 等）には依存しません。
 * 2. リソースの最適化: EngineLoader をシングルトン的に管理し、ブラウザのキャッシュ（OPFS）を最大限活用します。
 * 3. グローバル監視: 全てのエンジンのステータスや進捗を一箇所で集約して購読（バブリング）できる仕組みを提供します。
 */
export class EngineBridge implements IEngineBridge {
  /**
   * 登録されたアダプターのマップ。
   * ジェネリクス型がエンジンごとに異なるため、内部的には unknown/any キャストを許容して一元管理します。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private adapters = new Map<string, IEngineAdapter<any, any, any>>();
  
  /** システム全体に適用されるミドルウェアチェーン */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private middlewares: IMiddleware<any, any>[] = [];
  
  /** 
   * Facade のキャッシュ。
   * 同じエンジン ID に対しては常に同じインスタンスを返し、排他制御の状態を維持します。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private facades = new Map<string, EngineFacade<any, any, any>>();

  /** リスナーのクリーンアップ用管理マップ */
  private adapterUnsubscribers = new Map<string, (() => void)[]>();

  /** 非同期で初期化されるリソースローダーの Promise */
  private loaderPromise: Promise<EngineLoader> | null = null;

  // グローバルイベントリスナー
  private statusListeners = new Set<(id: string, status: EngineStatus) => void>();
  private progressListeners = new Set<(id: string, progress: ILoadProgress) => void>();
  private telemetryListeners = new Set<(id: string, event: ITelemetryEvent) => void>();

  /**
   * 環境に応じた最適な EngineLoader を非同期で取得します。
   * 初回呼び出し時に CapabilityDetector による診断を実行します。
   */
  async getLoader(): Promise<IEngineLoader> {
    if (!this.loaderPromise) {
      this.loaderPromise = (async () => {
        try {
          const caps = await this.checkCapabilities();
          const storage = createFileStorage(caps);
          return new EngineLoader(storage);
        } catch (err) {
          this.loaderPromise = null; // 再試行を可能にする
          throw err;
        }
      })();
    }
    return this.loaderPromise;
  }

  /**
   * エンジンアダプターを登録します。
   * 同じ ID のアダプターが既に存在する場合は、古い購読を全て解除して上書きします。
   */
  registerAdapter<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>): void {
    const id = adapter.id;

    if (this.adapters.has(id)) {
      console.warn(`[EngineBridge] Adapter "${id}" is already registered. Overwriting.`);
      this.adapterUnsubscribers.get(id)?.forEach(unsub => unsub());
      this.adapterUnsubscribers.delete(id);
      this.facades.delete(id);
    }

    const unsubscribers: (() => void)[] = [];
    
    // アダプターからのイベントをブリッジ全体へ転送
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
   * エンジン ID に対応する利用者向け Facade を取得します。
   */
  getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
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

    const facade = new EngineFacade<T_OPTIONS, T_INFO, T_RESULT>(adapter, sortedMiddlewares, this);
    this.facades.set(id, facade);
    
    return facade;
  }

  /**
   * グローバルに適用されるミドルウェアを追加します。
   * 注意: 既に生成済みの Facade キャッシュはクリアされ、次回取得時に新しいミドルウェアが反映されます。
   */
  use<T_INFO = unknown, T_RESULT = unknown>(middleware: IMiddleware<T_INFO, T_RESULT>): void {
    this.middlewares.push(middleware);
    this.facades.clear();
  }

  // --- グローバル購読メソッド ---

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
