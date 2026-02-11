import {
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineStatus,
  ILoadProgress,
  ILicenseInfo,
  IEngineSourceConfig,
  ISearchTask,
  ITelemetryEvent,
  IProtocolParser,
  IEngineLoader,
} from "../types";

/**
 * すべてのエンジンアダプターの基底となる抽象クラス。
 * 
 * 共通の状態管理（status, progress）、イベント配信、
 * および検索タスクの基本的な制御フローを提供します。
 */
export abstract class BaseAdapter<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>
{
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly engineLicense: ILicenseInfo;
  abstract readonly adapterLicense: ILicenseInfo;
  abstract readonly sources?: Record<string, IEngineSourceConfig>;
  abstract readonly parser: IProtocolParser<T_OPTIONS, T_INFO, T_RESULT>;

  protected _status: EngineStatus = "idle";
  protected _progress: ILoadProgress = {
    phase: "not-started",
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

  async prefetch?(): Promise<void> {
    // デフォルトでは何もしません。必要に応じてリバースプロキシやキャッシュの事前取得をサブクラスで実装します。
  }

  /** エンジンの初期化（リソースロード等）を実行します */
  abstract load(loader?: IEngineLoader): Promise<void>;
  
  /** 生成済みのコマンドを使用して探索を実行します */
  abstract searchRaw(command: string | string[] | Uint8Array): ISearchTask<T_INFO, T_RESULT>;

  /** 
   * 簡易呼び出し。オプションをパースして searchRaw を呼び出します。
   */
  search(options: T_OPTIONS): ISearchTask<T_INFO, T_RESULT> {
    const command = this.parser.createSearchCommand(options);
    return this.searchRaw(command);
  }

  /** リソースを解放し、インスタンスを終了します */
  abstract dispose(): Promise<void>;

  /**
   * ステータス変更を購読します。
   * @returns 購読解除用の関数
   */
  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    this.statusListeners.add(callback);
    // 購読開始時に現在の状態を即座に通知 (Initial sync)
    callback(this._status);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * 進捗状況を購読します。
   * @returns 購読解除用の関数
   */
  onProgress(callback: (progress: ILoadProgress) => void): () => void {
    this.progressListeners.add(callback);
    callback(this._progress);
    return () => this.progressListeners.delete(callback);
  }

  /**
   * テレメトリイベント（統計情報）を購読します。
   * @returns 購読解除用の関数
   */
  onTelemetry(callback: (event: ITelemetryEvent) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  /**
   * 外部からテレメトリを発行します。ブリッジやファサードが統計を記録する際に使用します。
   */
  public emitTelemetry(event: ITelemetryEvent): void {
    this.telemetryListeners.forEach((cb) => cb(event));
  }

  // --- 内部ヘルパー（サブクラスで使用） ---

  /** ステータスを更新し、リスナーへ通知します */
  protected emitStatusChange(status: EngineStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  /** 進捗状況を更新し、リスナーへ通知します */
  protected emitProgress(progress: ILoadProgress): void {
    this._progress = progress;
    this.progressListeners.forEach((cb) => cb(progress));
  }

  /** 全てのリスナーをクリアします（dispose時に使用） */
  protected clearListeners(): void {
    this.statusListeners.clear();
    this.progressListeners.clear();
    this.telemetryListeners.clear();
  }
}
