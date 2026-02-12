import {
  IEngineAdapter,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ISearchTask,
  IProtocolParser,
  IEngineLoader,
} from "../types";

/**
 * すべてのエンジンアダプターの基底クラス。
 * 状態管理、イベント配信、ライフサイクル管理の共通機能を提供します。
 */
export abstract class BaseAdapter<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> implements IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT> {
  protected _status: EngineStatus = "uninitialized";
  protected statusListeners = new Set<(status: EngineStatus) => void>();
  protected progressListeners = new Set<(progress: ILoadProgress) => void>();
  protected telemetryListeners = new Set<(event: ITelemetryEvent) => void>();

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly parser: IProtocolParser<T_OPTIONS, T_INFO, T_RESULT>;

  get status(): EngineStatus {
    return this._status;
  }

  abstract load(loader?: IEngineLoader): Promise<void>;
  abstract searchRaw(command: string | string[] | Uint8Array | unknown): ISearchTask<T_INFO, T_RESULT>;
  
  /**
   * エンジンオプションを設定します。
   * エンジンがロードされていない場合はエラーを投げます。
   * 注意: 探索中 (busy) のオプション変更はエンジンによって挙動が異なります。
   */
  async setOption(name: string, value: string | number | boolean): Promise<void> {
    if (this._status !== "ready" && this._status !== "busy") {
      throw new Error(`Cannot set option: Engine is not ready (current status: ${this._status})`);
    }
    await this.sendOptionToWorker(name, value);
  }

  protected abstract sendOptionToWorker(name: string, value: string | number | boolean): Promise<void>;

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

  abstract dispose(): Promise<void>;

  /**
   * 状態変更を通知します。
   */
  protected emitStatusChange(status: EngineStatus): void {
    this._status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  /**
   * ロード進捗を通知します。
   */
  protected emitProgress(progress: ILoadProgress): void {
    for (const listener of this.progressListeners) {
      listener(progress);
    }
  }

  /**
   * テレメトリイベントを通知します。
   */
  protected emitTelemetry(event: ITelemetryEvent): void {
    for (const listener of this.telemetryListeners) {
      listener(event);
    }
  }

  /**
   * 全てのリスナーを解除します。
   */
  protected clearListeners(): void {
    this.statusListeners.clear();
    this.progressListeners.clear();
    this.telemetryListeners.clear();
  }
}
