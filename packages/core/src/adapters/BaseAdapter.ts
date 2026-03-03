import { createI18nKey } from "../protocol/ProtocolValidator.js";
import {
  IEngineAdapter,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  IEngineConfig,
  IEngineSourceConfig,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineErrorCode,
  IBookAsset,
  ILicenseInfo,
  ISearchTask,
} from "../types.js";
import { EngineError } from "../errors/EngineError.js";
import { WorkerCommunicator } from "../workers/WorkerCommunicator.js";

/**
 * 2026 Zenith Tier: 全てのアダプターの基底クラス。
 * 共通のライフサイクル管理、イベント通知、ストリーム制御、およびバリデーションを物理的に提供します。
 */
export abstract class BaseAdapter<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>
{
  protected _status: EngineStatus = "uninitialized";
  protected communicator: WorkerCommunicator | null = null;
  protected activeLoader: {
    loadResource: (engineId: string, config: IEngineSourceConfig) => Promise<string>;
  } | null = null;

  protected readonly statusListeners = new Set<(status: EngineStatus) => void>();
  protected readonly infoListeners = new Set<(info: T_INFO) => void>();
  protected readonly resultListeners = new Set<(result: T_RESULT) => void>();
  protected readonly progressListeners = new Set<(progress: ILoadProgress) => void>();
  protected readonly telemetryListeners = new Set<(event: ITelemetryEvent) => void>();

  protected pendingResolve: ((value: T_RESULT) => void) | null = null;
  protected pendingReject: ((reason?: unknown) => void) | null = null;
  protected messageUnsubscriber: (() => void) | null = null;
  protected infoController: ReadableStreamDefaultController<T_INFO> | null = null;

  // 物理的な識別子。サブクラスでのプロパティ上書きを避けるため、コンストラクタで確定させます。
  public readonly id: string;
  public readonly name: string;

  constructor(
    id: string,
    name: string,
    protected readonly config: IEngineConfig = {}
  ) {
    this.id = id;
    this.name = name;
    this.config = config || {};
    if (this.config.sources) {
      this.validateSources();
    }
  }

  abstract readonly version: string;
  abstract readonly engineLicense: ILicenseInfo;
  abstract readonly adapterLicense: ILicenseInfo;
  abstract readonly parser: {
    createSearchCommand: (options: T_OPTIONS) => unknown;
    createStopCommand: () => unknown;
    createOptionCommand: (name: string, value: string | number | boolean) => unknown;
    parseInfo: (raw: unknown) => T_INFO | null;
    parseResult: (raw: unknown) => T_RESULT | null;
    isReadyCommand: string;
    readyResponse: string;
    translateError?: (raw: unknown) => string | null;
  };

  get status(): EngineStatus {
    return this._status;
  }

  get progress(): ILoadProgress {
    return { status: this._status, loadedBytes: 0 };
  }

  private validateSources(): void {
    const sources = this.config.sources;
    if (!sources || !sources.main) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Engine "${this.id}" requires a "main" source.`,
        engineId: this.id,
        i18nKey: createI18nKey("factory.requiresMainSource"),
      });
    }

    for (const [key, source] of Object.entries(sources)) {
      const sri = (source as IEngineSourceConfig).sri;
      if (sri && !/^(sha256|sha384|sha512)-[A-Za-z0-9+/=]+$/.test(sri)) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: `Invalid SRI hash format for source "${key}".`,
          engineId: this.id,
          i18nKey: createI18nKey("engine.errors.validationError"),
        });
      }
    }
  }

  async setBook(
    asset: IBookAsset,
    _options?: { signal?: AbortSignal; onProgress?: (p: ILoadProgress) => void },
  ): Promise<void> {
    if (!this.activeLoader) {
      throw new EngineError({ code: EngineErrorCode.VALIDATION_ERROR, message: "No loader", engineId: this.id });
    }
    const config: IEngineSourceConfig = { url: asset.url, type: "asset", sri: asset.sri };
    if (asset.size) config.size = asset.size;
    const blobUrl = await this.activeLoader.loadResource(this.id, config);
    await this.onBookLoaded(blobUrl);
  }

  abstract load(loader?: unknown): Promise<void>;

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    const task = this.searchRaw(this.parser.createSearchCommand(options));
    return task.result;
  }

  searchRaw(command: unknown): ISearchTask<T_INFO, T_RESULT> {
    if (this._status !== "ready" && this._status !== "busy") {
      throw new EngineError({ code: EngineErrorCode.NOT_READY, message: "Engine not ready", engineId: this.id });
    }

    if (this._status === "busy") {
      this.cleanupPendingTask("Replaced by new search", true);
    }
    
    this.emitStatusChange("busy");

    const readableStream = new ReadableStream<T_INFO>({
      start: (controller) => {
        this.infoController = controller;
      },
      cancel: () => {
        return this.handleStreamCancel().catch(() => {});
      },
    });

    const infoStream: AsyncIterable<T_INFO> = {
      [Symbol.asyncIterator]: async function* () {
        const reader = readableStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield value;
          }
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
      },
    };

    const resultPromise = new Promise<T_RESULT>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    if (this.communicator) {
      this.messageUnsubscriber?.();
      this.messageUnsubscriber = this.communicator.onMessage((data) => {
        this.handleIncomingMessage(data);
      });

      try {
        this.sendSearchCommand(command);
      } catch (err) {
        // 送信失敗時は Promise を即座に破棄して例外を投げ、Unhandled Rejection を防止
        this.pendingResolve = null;
        this.pendingReject = null;
        this.emitStatusChange("ready");
        throw err;
      }
    }

    return {
      info: infoStream,
      result: resultPromise,
      stop: () => this.stop(),
    };
  }

  async stop(): Promise<void> {
    if (this._status !== "busy") return;
    if (this.communicator) {
      await this.communicator.postMessage(this.parser.createStopCommand());
    }
    this.cleanupPendingTask("Search aborted");
  }

  async setOption(name: string, value: string | number | boolean): Promise<void> {
    if (this.communicator) {
      await this.communicator.postMessage(this.parser.createOptionCommand(name, value));
    }
  }

  async dispose(): Promise<void> {
    this.cleanupPendingTask("Adapter disposed", true);
    if (this.communicator) {
      await this.communicator.terminate();
    }
    this.communicator = null;
    this.activeLoader = null;
    this.emitStatusChange("terminated");
    this.clearListeners();
  }

  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onInfo(callback: (info: T_INFO) => void): () => void {
    this.infoListeners.add(callback);
    return () => this.infoListeners.delete(callback);
  }

  onSearchResult(callback: (result: T_RESULT) => void): () => void {
    this.resultListeners.add(callback);
    return () => this.resultListeners.delete(callback);
  }

  onProgress(callback: (progress: ILoadProgress) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  onTelemetry(callback: (event: ITelemetryEvent) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  // 物理的に IEngineAdapter の updateStatus/emitTelemetry を提供
  public updateStatus(status: EngineStatus): void {
    this.emitStatusChange(status);
  }

  public emitTelemetry(event: ITelemetryEvent): void {
    for (const listener of this.telemetryListeners) {
      listener(event);
    }
  }

  protected async handleStreamCancel(): Promise<void> {
    await this.stop();
  }

  protected handleIncomingMessage(data: unknown): void {
    if (this._status === "error" || this._status === "terminated") return;

    const info = this.parser.parseInfo(data);
    if (info) {
      try {
        this.infoController?.enqueue(info);
      } catch { /* ignore */ }
      for (const listener of this.infoListeners) listener(info);
      return;
    }

    const result = this.parser.parseResult(data);
    if (result) {
      if (this.pendingResolve) {
        this.pendingResolve(result);
        this.pendingResolve = null;
        this.pendingReject = null;
      }
      for (const listener of this.resultListeners) listener(result);
      this.emitStatusChange("ready");
      return;
    }

    if (typeof data === "string" && data.startsWith("error") && this.parser.translateError) {
      const message = this.parser.translateError(data);
      if (message) {
        this.emitStatusChange("error");
        this.cleanupPendingTask(message, true); // skipReadyTransition = true
        this.pendingReject?.(new EngineError({
          code: EngineErrorCode.PROTOCOL_ERROR,
          message,
          engineId: this.id,
        }));
      }
    }
  }

  protected cleanupPendingTask(reason?: string, skipReadyTransition = false): void {
    if (this.pendingReject) {
      const reject = this.pendingReject;
      this.pendingReject = null;
      this.pendingResolve = null;
      
      // 物理的に浮遊するリジェクトを防ぐため、マイクロタスクで排出。
      // かつ、テスト環境でのハングを防ぐため、リジェクト直後にストリームを閉じる。
      void Promise.resolve().then(() => {
        reject(new EngineError({
          code: EngineErrorCode.SEARCH_ABORTED,
          message: reason ?? "The search task was aborted.",
          engineId: this.id,
        }));
      });
    }

    if (this.infoController) {
      try {
        this.infoController.close();
      } catch { /* ignore */ }
      this.infoController = null;
    }

    if (this._status === "busy" && !skipReadyTransition) {
      this.emitStatusChange("ready");
    }
  }

  protected emitStatusChange(status: EngineStatus): void {
    this._status = status;
    if (status === "error" || status === "terminated") {
      if (this.infoController) {
        try {
          this.infoController.close();
        } catch { /* ignore */ }
        this.infoController = null;
      }
    }
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  protected emitProgress(progress: ILoadProgress): void {
    for (const listener of this.progressListeners) listener(progress);
  }

  protected clearListeners(): void {
    this.statusListeners.clear();
    this.progressListeners.clear();
    this.telemetryListeners.clear();
    this.infoListeners.clear();
    this.resultListeners.clear();
  }

  protected sendSearchCommand(command: unknown): void {
    if (Array.isArray(command)) {
      for (const cmd of command) this.communicator?.postMessage(cmd);
    } else {
      this.communicator?.postMessage(command);
    }
  }

  protected abstract onInitialize(): Promise<void>;
  protected abstract onSearchRaw(command: unknown): Promise<void>;
  protected abstract onStop(): Promise<void>;
  protected abstract onDispose(): Promise<void>;
  protected abstract onBookLoaded(url: string): Promise<void>;
}
