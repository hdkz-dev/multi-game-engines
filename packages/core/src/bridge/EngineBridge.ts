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
 * 役割:
 * 1. 各アダプター（Stockfish, やねうら王等）の登録とライフサイクル管理
 * 2. ミドルウェアチェーン（入出力の加工）の統合
 * 3. エンジンからのイベント（ステータス、テレメトリ）のグローバル集約（バブリング）
 * 4. 実行環境の能力診断とリソースローダーの提供
 */
export class EngineBridge implements IEngineBridge {
  /**
   * 登録されたアダプターのマップ。
   * ジェネリクス（Options/Info/Result）がエンジンごとに異なるため、
   * 内部管理用として意図的に any を許容するインターフェースで保持します。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private adapters = new Map<string, IEngineAdapter<any, any, any>>();
  
  /** 
   * グローバルに適用されるミドルウェアのリスト。
   * 通信データ型が多岐にわたるため、内部的には any を許容します。
   */
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
   * 初回呼び出し時に CapabilityDetector と FileStorage を初期化します。
   * 初期化に失敗した場合はキャッシュをクリアし、再試行可能にします。
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
   * 登録時にアダプターのイベントをブリッジのグローバルリスナーへ転送する設定を行います。
   * 既存のアダプターがある場合は、古いリスナーを解除して上書きします。
   */
  registerAdapter<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>): void {
    const id = adapter.id;

    if (this.adapters.has(id)) {
      console.warn(`Adapter with ID "${id}" is already registered. Overwriting.`);
      // 既存のリスナーを解除
      const oldUnsubs = this.adapterUnsubscribers.get(id);
      oldUnsubs?.forEach(unsub => unsub());
      this.adapterUnsubscribers.delete(id);
      // Facade キャッシュも無効化
      this.facades.delete(id);
    }

    // アダプター個別のイベントをグローバルに伝播（バブリング）させる
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
   * 同一IDに対しては同じ Facade インスタンスを返し、タスクの状態（排他制御）を共有します。
   * 
   * @throws {EngineError} エンジンが見つからない場合に発生
   */
  getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(id: string): IEngine<T_OPTIONS, T_INFO, T_RESULT> {
    // キャッシュがあればそれを返す
    if (this.facades.has(id)) {
      return this.facades.get(id) as unknown as IEngine<T_OPTIONS, T_INFO, T_RESULT>;
    }

    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, `Engine "${id}" not found.`);
    }

    // 優先度が高い順にミドルウェアをソート
    const sortedMiddlewares = [...this.middlewares].sort(
      (a, b) => (b.priority ?? MiddlewarePriority.NORMAL) - (a.priority ?? MiddlewarePriority.NORMAL)
    );

    // 利用者はこの Facade を通じてエンジンを操作する
    const facade = new EngineFacade<T_OPTIONS, T_INFO, T_RESULT>(adapter, sortedMiddlewares, this);
    this.facades.set(id, facade);
    
    return facade;
  }

  /**
   * ブリッジ全体に適用するミドルウェアを追加します。
   * 注意: 既生成済みの Facade には反映されません（設計上のトレードオフ）。
   */
  use<T_INFO = unknown, T_RESULT = unknown>(middleware: IMiddleware<T_INFO, T_RESULT>): void {
    this.middlewares.push(middleware);
  }

  /**
   * 全エンジンのステータス変化を一括監視します。
   * @returns 購読解除関数
   */
  onGlobalStatusChange(callback: (id: string, status: EngineStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * 全エンジンのテレメトリを一括収集します（分析・モニタリング用）。
   * @returns 購読解除関数
   */
  onGlobalTelemetry(callback: (id: string, event: ITelemetryEvent) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  /**
   * 実行環境の能力を診断します。
   */
  async checkCapabilities(): Promise<ICapabilities> {
    return await CapabilityDetector.detect();
  }

  /**
   * 実行環境のセキュリティ状態を取得します。
   */
  getSecurityStatus(): ISecurityStatus {
    return SecurityAdvisor.getStatus();
  }
}
