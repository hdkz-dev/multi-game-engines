import { createI18nKey } from "../protocol/ProtocolValidator.js";
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
  ResourceMap,
  IEngineConfig,
  PositionId,
  IBookAsset,
  ProgressCallback,
  IEngineSourceConfig,
} from "../types.js";
import { WorkerCommunicator } from "../workers/WorkerCommunicator.js";
import { EngineError } from "../errors/EngineError.js";
import { EnvironmentDiagnostics } from "../utils/EnvironmentDiagnostics.js";

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
  protected infoListeners = new Set<(info: T_INFO) => void>();
  protected resultListeners = new Set<(result: T_RESULT) => void>();

  // 共通状態管理
  protected communicator: WorkerCommunicator | null = null;
  protected activeLoader: IEngineLoader | null = null;
  protected messageUnsubscriber: (() => void) | null = null;
  protected pendingResolve: ((result: T_RESULT) => void) | null = null;
  protected pendingReject: ((reason?: unknown) => void) | null = null;
  protected infoController: ReadableStreamDefaultController<T_INFO> | null =
    null;
  protected currentPositionId: PositionId | null = null;

  protected config: IEngineConfig;

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly parser: IProtocolParser<T_OPTIONS, T_INFO, T_RESULT>;

  constructor(config: IEngineConfig = {}) {
    this.config = config;
  }

  get status(): EngineStatus {
    return this._status;
  }

  updateStatus(status: EngineStatus): void {
    this.emitStatusChange(status);
  }

  /**
   * 2026 Best Practice: リソースソースの SRI ハッシュを検証します。
   */
  protected validateSources(): void {
    const sources = this.config.sources;
    if (!sources) return;

    const sriPattern =
      /^sha256-[A-Za-z0-9+/]{43}=?$|^sha384-[A-Za-z0-9+/]{64}$|^sha512-[A-Za-z0-9+/]{86}={0,2}$/;

    for (const [key, source] of Object.entries(sources)) {
      if (source && typeof source === "object" && "sri" in source) {
        const sri = (source as { sri?: string }).sri;
        if (sri && (!sriPattern.test(sri) || /placeholder/i.test(sri))) {
          const i18nKey = createI18nKey("engine.errors.sriMismatch");
          throw new EngineError({
            code: EngineErrorCode.VALIDATION_ERROR,
            message: `Engine Adapter "${this.id}": Source "${key}" has an invalid or placeholder SRI hash: "${sri}"`,
            i18nKey,
            remediation:
              "Provide a valid Base64-encoded SRI hash for all engine resources in the constructor config.",
            engineId: this.id,
          });
        }
      }
    }
  }

  abstract load(loader?: IEngineLoader): Promise<void>;

  protected async loadWithProgress(
    loader: IEngineLoader,
    configs: Record<string, IEngineSourceConfig>,
    signal?: AbortSignal,
  ): Promise<Record<string, string>> {
    const options: {
      signal?: AbortSignal;
      onProgress?: (p: ILoadProgress) => void;
    } = {
      onProgress: (p) => this.emitProgress(p),
    };
    if (signal) options.signal = signal;

    return await loader.loadResources(this.id, configs, options);
  }

  async setBook(
    asset: IBookAsset,
    options?: { signal?: AbortSignal; onProgress?: ProgressCallback },
  ): Promise<void> {
    if (!this.activeLoader) {
      const i18nKey = createI18nKey("engine.errors.loaderRequired");
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: "Loader required to set book",
        engineId: this.id,
        i18nKey,
      });
    }

    if (!asset.sri && !asset.__unsafeNoSRI) {
      const i18nKey = createI18nKey("engine.errors.sriMismatch");
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Engine Adapter "${this.id}": Book asset "${asset.id}" requires an SRI hash for security.`,
        i18nKey,
        engineId: this.id,
      });
    }

    const config: IEngineSourceConfig = asset.sri
      ? { url: asset.url, type: "asset", sri: asset.sri }
      : { url: asset.url, type: "asset", __unsafeNoSRI: true };

    if (asset.size) {
      config.size = asset.size;
    }

    const blobUrl = await this.activeLoader.loadResource(
      this.id,
      config,
      options,
    );

    await this.onBookLoaded(blobUrl);
  }

  protected abstract onBookLoaded(url: string): Promise<void>;

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    this.currentPositionId = options.positionId ?? null;
    const command = this.parser.createSearchCommand(options);
    return this.searchRaw(command).result;
  }

  protected checkEnvironment(): void {
    EnvironmentDiagnostics.warnIfSuboptimal();
  }

  /**
   * 共通の探索実行ロジック。
   */
  searchRaw(
    command: string | string[] | Uint8Array | Record<string, unknown>,
  ): ISearchTask<T_INFO, T_RESULT> {
    if (this._status !== "ready" && this._status !== "busy") {
      const i18nKey = createI18nKey("engine.errors.notReady");
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: "Engine is not ready",
        engineId: this.id,
        i18nKey,
      });
    }

    if (!this.communicator) {
      const i18nKey = createI18nKey("engine.errors.initializationFailed");
      throw new EngineError({
        code: EngineErrorCode.INTERNAL_ERROR,
        message: "Communicator not initialized",
        engineId: this.id,
        i18nKey,
      });
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
        // 2026: 物理的なクリーンアップをトリガー
        this.handleStreamCancel().catch(() => {});
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
          // 2026: 明示的なキャンセルによるライフサイクル完了を保証
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
      },
    };

    const resultPromise = new Promise<T_RESULT>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    this.messageUnsubscriber?.();

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
   * 2026 Zenith: ストリームが外部（ユーザー等）によってキャンセルされた際の処理。
   * テスト容易性を高めるために独立したメソッドとして定義。
   */
  protected async handleStreamCancel(): Promise<void> {
    await this.stop();
  }

  protected handleIncomingMessage(data: unknown): void {
    if (this._status === "terminated" || this._status === "disposed") {
      return;
    }
    if (
      typeof data !== "string" &&
      (typeof data !== "object" || data === null)
    ) {
      return;
    }

    const input = data as string | Record<string, unknown>;

    if (typeof input === "string" && this.parser.translateError) {
      const errorKey = this.parser.translateError(input);
      if (errorKey) {
        console.error(`[BaseAdapter] Engine reported error: ${input}`);
        if (this.pendingReject) {
          this.pendingReject(
            new EngineError({
              code: EngineErrorCode.INTERNAL_ERROR,
              message: `Engine reported error: ${input}`,
              engineId: this.id,
              i18nKey: errorKey,
            }),
          );
          this.pendingReject = null;
        }
        this.cleanupPendingTask(`Engine error: ${input}`);
        this.emitStatusChange("error");
        return;
      }
    }

    const info = this.parser.parseInfo(
      input,
      this.currentPositionId ?? undefined,
    );
    if (info) {
      try {
        this.infoController?.enqueue(info);
      } catch {
        // Stream closed
      }
      for (const listener of this.infoListeners) {
        try {
          listener(info);
        } catch (err) {
          console.error(
            `[BaseAdapter] Error in info listener for engine ${this.id}:`,
            err,
          );
        }
      }
    }

    const result = this.parser.parseResult(input);
    if (result) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      this.pendingReject = null;
      resolve?.(result);
      for (const listener of this.resultListeners) {
        try {
          listener(result);
        } catch (err) {
          console.error(
            `[BaseAdapter] Error in search result listener for engine ${this.id}:`,
            err,
          );
        }
      }
      this.cleanupPendingTask("Search completed successfully");
    }
  }

  protected sendSearchCommand(
    command: string | string[] | Uint8Array | Record<string, unknown>,
  ): void {
    if (Array.isArray(command)) {
      for (const cmd of command) {
        this.communicator?.postMessage(cmd);
      }
    } else if (command instanceof Uint8Array) {
      this.communicator?.postMessage(command, [command.buffer]);
    } else {
      this.communicator?.postMessage(command);
    }
  }

  protected async injectResources(resources: ResourceMap): Promise<void> {
    if (!this.communicator) return;

    const readyPromise = this.communicator.expectMessage(
      (data) => {
        return (data as Record<string, unknown>)?.type === "MG_RESOURCES_READY";
      },
      { timeoutMs: 5000 },
    );

    this.communicator.postMessage({
      type: "MG_INJECT_RESOURCES",
      resources,
    });

    await readyPromise;
  }

  async stop(): Promise<void> {
    if (this._status !== "busy") {
      return;
    }

    if (this.communicator) {
      await this.communicator.postMessage(this.parser.createStopCommand());
    }
    this.cleanupPendingTask("Search aborted");
    this.emitStatusChange("ready");
  }

  async setOption(
    name: string,
    value: string | number | boolean,
  ): Promise<void> {
    if (this._status !== "ready" && this._status !== "busy") {
      const i18nKey = createI18nKey("engine.errors.notReady");
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: `Cannot set option: Engine is not ready (current status: ${this._status})`,
        engineId: this.id,
        i18nKey,
      });
    }
    await this.sendOptionToWorker(name, value);
  }

  protected async sendOptionToWorker(
    name: string,
    value: string | number | boolean,
  ): Promise<void> {
    if (!this.communicator) {
      const i18nKey = createI18nKey("engine.errors.notReady");
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: "Engine is not loaded",
        engineId: this.id,
        i18nKey,
      });
    }
    this.communicator.postMessage(this.parser.createOptionCommand(name, value));
  }

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

  protected cleanupPendingTask(
    reason?: string,
    skipReadyTransition = false,
  ): void {
    if (this.pendingReject) {
      const i18nKey = createI18nKey("engine.errors.searchAborted");
      this.pendingReject(
        new EngineError({
          code: EngineErrorCode.SEARCH_ABORTED,
          message:
            reason ??
            "Search aborted: Replaced by new command or engine reset.",
          engineId: this.id,
          i18nKey: reason ? undefined : i18nKey,
          remediation:
            "This is a normal operational event. No action required unless search is unexpectedly stopping.",
        }),
      );
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

  protected emitStatusChange(status: EngineStatus): void {
    this._status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  protected emitProgress(progress: ILoadProgress): void {
    for (const listener of this.progressListeners) {
      listener(progress);
    }
  }

  public emitTelemetry(event: ITelemetryEvent): void {
    for (const listener of this.telemetryListeners) {
      listener(event);
    }
  }

  protected clearListeners(): void {
    this.statusListeners.clear();
    this.progressListeners.clear();
    this.telemetryListeners.clear();
    this.infoListeners.clear();
    this.resultListeners.clear();
  }
}
