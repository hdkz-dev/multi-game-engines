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
  EngineErrorCode,
} from "../types.js";
import { WorkerCommunicator } from "../workers/WorkerCommunicator.js";
import { EngineError } from "../errors/EngineError.js";

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

  // 共通状態管理
  protected communicator: WorkerCommunicator | null = null;
  protected activeLoader: IEngineLoader | null = null;
  protected messageUnsubscriber: (() => void) | null = null;
  protected pendingResolve: ((result: T_RESULT) => void) | null = null;
  protected pendingReject: ((reason?: unknown) => void) | null = null;
  protected infoController: ReadableStreamDefaultController<T_INFO> | null = null;

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly parser: IProtocolParser<T_OPTIONS, T_INFO, T_RESULT>;

  get status(): EngineStatus {
    return this._status;
  }

  abstract load(loader?: IEngineLoader): Promise<void>;

  /**
   * 共通の探索実行ロジック。
   * 大半のアダプターで共通のライフサイクル（リスナー登録、コマンド送信、ストリーム配信）を実装します。
   */
  searchRaw(command: string | string[] | Uint8Array | Record<string, unknown>): ISearchTask<T_INFO, T_RESULT> {
    if (this._status !== "ready") {
      throw new EngineError(EngineErrorCode.NOT_READY, "Engine is not ready", this.id);
    }

    if (!this.communicator) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, "Communicator not initialized", this.id);
    }

    this.cleanupPendingTask("Replaced by new search");
    this.emitStatusChange("busy");

    const infoStream = new ReadableStream<T_INFO>({
      start: (controller) => {
        this.infoController = controller;
      },
      cancel: () => {
        void this.stop();
      },
    }) as unknown as AsyncIterable<T_INFO>;

    const resultPromise = new Promise<T_RESULT>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    this.messageUnsubscriber?.();

    // 2026 Best Practice: 送信前にリスナーを登録
    this.messageUnsubscriber = this.communicator.onMessage((data) => {
      this.handleIncomingMessage(data);
    });

    this.sendSearchCommand(command);

    return {
      info: infoStream,
      result: resultPromise,
      stop: () => this.stop(),
    };
  }

  /**
   * Worker からのメッセージを処理します。
   */
  protected handleIncomingMessage(data: unknown): void {
    if (typeof data !== "object" || data === null) return;
    const record = data as Record<string, unknown>;

    const info = this.parser.parseInfo(record);
    if (info) {
      this.infoController?.enqueue(info);
    }

    const result = this.parser.parseResult(record);
    if (result) {
      this.pendingResolve?.(result);
      this.pendingReject = null; // 解決済みなので reject をクリア
      this.cleanupPendingTask();
    }
  }

  /**
   * 探索コマンドを Worker に送信します。
   */
  protected sendSearchCommand(command: string | string[] | Uint8Array | Record<string, unknown>): void {
    if (Array.isArray(command)) {
      for (const cmd of command) {
        this.communicator?.postMessage(cmd);
      }
    } else {
      this.communicator?.postMessage(command);
    }
  }

  /**
   * 探索を停止します。
   */
  async stop(): Promise<void> {
    this.cleanupPendingTask("Search aborted");
    if (!this.communicator) return;
    this.communicator.postMessage(this.parser.createStopCommand());
  }

  /**
   * エンジンオプションを設定します。
   */
  async setOption(name: string, value: string | number | boolean): Promise<void> {
    if (this._status !== "ready" && this._status !== "busy") {
      throw new EngineError(EngineErrorCode.NOT_READY, `Cannot set option: Engine is not ready (current status: ${this._status})`, this.id);
    }
    await this.sendOptionToWorker(name, value);
  }

  protected async sendOptionToWorker(name: string, value: string | number | boolean): Promise<void> {
    if (!this.communicator) {
      throw new EngineError(EngineErrorCode.NOT_READY, "Engine is not loaded", this.id);
    }
    this.communicator.postMessage(this.parser.createOptionCommand(name, value));
  }

  /**
   * リソースを解放します。
   */
  async dispose(): Promise<void> {
    this.cleanupPendingTask("Adapter disposed", true);
    this.messageUnsubscriber?.();
    this.messageUnsubscriber = null;
    this.communicator?.terminate();
    this.communicator = null;
    this.activeLoader = null;
    this.emitStatusChange("terminated");
    this.clearListeners();
  }

  /**
   * 進行中のタスクをクリーンアップします。
   */
  protected cleanupPendingTask(reason?: string, skipReadyTransition = false): void {
    if (this.pendingReject) {
      this.pendingReject(new EngineError(EngineErrorCode.INTERNAL_ERROR, reason ?? "Task cleaned up", this.id));
    }
    
    this.pendingResolve = null;
    this.pendingReject = null;

    if (this.infoController) {
      try {
        this.infoController.close();
      } catch {
        // Ignore
      }
      this.infoController = null;
    }

    if (this._status === "busy" && !skipReadyTransition) {
      this.emitStatusChange("ready");
    }
  }

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
