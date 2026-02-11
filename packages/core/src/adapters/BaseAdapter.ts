import {
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineStatus,
  ILicenseInfo,
  IEngineSourceConfig,
  ILoadProgress,
  ITelemetryEvent,
  ISearchTask,
  IEngineLoader,
  IProtocolParser,
} from "../types";

/**
 * すべてのエンジンアダプターの基底となる抽象クラス。
 * 
 * ステータス管理、進捗通知、テレメトリ集計などの共通機能を実装し、
 * 各エンジン固有のプロトコル実装（searchRaw）を抽象化します。
 */
export abstract class BaseAdapter<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> implements IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>
{
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly engineLicense: ILicenseInfo;
  abstract readonly adapterLicense: ILicenseInfo;
  abstract readonly sources?: Record<string, IEngineSourceConfig>;
  abstract readonly parser: IProtocolParser<T_OPTIONS, T_INFO, T_RESULT>;

  protected _status: EngineStatus = "uninitialized";
  protected _progress: ILoadProgress = {
    phase: "initializing",
    percentage: 0,
    i18n: {
      key: "progress.not_started",
      defaultMessage: "Not started",
    },
  };

  /** 各種イベントのリスナーセット */
  private statusListeners = new Set<(status: EngineStatus) => void>();
  private progressListeners = new Set<(progress: ILoadProgress) => void>();
  private telemetryListeners = new Set<(event: ITelemetryEvent) => void>();

  // --- IEngineAdapterInfo の実装 ---

  get status(): EngineStatus {
    return this._status;
  }

  get progress(): ILoadProgress {
    return this._progress;
  }

  // --- IEngineAdapter の実装 ---

  async prefetch(): Promise<void> {
    // デフォルトでは何もしません。
  }

  abstract load(loader?: IEngineLoader): Promise<void>;
  
  abstract searchRaw(command: string | string[] | Uint8Array): ISearchTask<T_INFO, T_RESULT>;

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    const command = this.parser.createSearchCommand(options);
    const task = this.searchRaw(command);
    return task.result;
  }

  // --- イベント購読の実装 ---

  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onProgress(callback: (progress: ILoadProgress) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  onTelemetry(callback: (event: ITelemetryEvent) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  /** 全てのリスナーを解除します（dispose用） */
  protected clearListeners(): void {
    this.statusListeners.clear();
    this.progressListeners.clear();
    this.telemetryListeners.clear();
  }

  // --- 内部イベント発火用ヘルパー ---

  protected emitStatusChange(status: EngineStatus): void {
    this._status = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  protected emitProgress(progress: ILoadProgress): void {
    this._progress = progress;
    this.progressListeners.forEach((cb) => cb(progress));
  }

  protected emitTelemetry(event: ITelemetryEvent): void {
    this.telemetryListeners.forEach((cb) => cb(event));
  }

  abstract dispose(): Promise<void>;
}
