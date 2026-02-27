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
  I18nKey,
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

  /**
   * 2026 Best Practice: リソースソースの SRI ハッシュを検証します。
   * プレースホルダーの検出と形式チェックを一括で行います。
   */
  protected validateSources(): void {
    const sources = this.config.sources;
    if (!sources) return;

    // 2026 Best Practice: SRI ハッシュのアルゴリズムに応じた正確な Base64 長さを検証。
    // sha256: 44 chars, sha384: 64 chars, sha512: 88 chars.
    const sriPattern =
      /^sha256-[A-Za-z0-9+/]{43}=?$|^sha384-[A-Za-z0-9+/]{64}$|^sha512-[A-Za-z0-9+/]{86}={0,2}$/;

    for (const [key, source] of Object.entries(sources)) {
      const sri = source?.sri;
      if (sri && (!sriPattern.test(sri) || /placeholder/i.test(sri))) {
        const i18nKey = "engine.errors.sriMismatch" as I18nKey;
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

  abstract load(loader?: IEngineLoader): Promise<void>;

  /**
   * 2026 Best Practice: オプションを直接受け取って探索を開始するコンビニエンスメソッド。
   */
  async search(options: T_OPTIONS): Promise<T_RESULT> {
    const command = this.parser.createSearchCommand(options);
    return this.searchRaw(command).result;
  }

  /**
   * 2026 Zenith Tier: 実行環境の能力チェックを追加。
   */
  protected checkEnvironment(): void {
    EnvironmentDiagnostics.warnIfSuboptimal();
  }

  /**
   * 共通の探索実行ロジック。
   */
  searchRaw(
    command: string | string[] | Uint8Array | Record<string, unknown>,
  ): ISearchTask<T_INFO, T_RESULT> {
    if (this._status !== "ready") {
      const i18nKey = "engine.errors.notReady" as I18nKey;
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: "Engine is not ready",
        engineId: this.id,
        i18nKey,
      });
    }

    if (!this.communicator) {
      const i18nKey = "engine.errors.initializationFailed" as I18nKey;
      throw new EngineError({
        code: EngineErrorCode.INTERNAL_ERROR,
        message: "Communicator not initialized",
        engineId: this.id,
        i18nKey,
      });
    }

    this.cleanupPendingTask("Replaced by new search");
    this.emitStatusChange("busy");

    // 2026 Best Practice: Safari 互換性のため ReadableStream を AsyncGenerator でラップ
    const readableStream = new ReadableStream<T_INFO>({
      start: (controller) => {
        this.infoController = controller;
      },
      cancel: () => {
        void this.stop();
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
          reader.releaseLock();
        }
      },
    };

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
    if (this._status === "terminated" || this._status === "disposed") {
      return;
    }
    // 2026 Best Practice: 文字列とオブジェクトの両方をプロトコル解析に渡す
    // UCI/USI/GTP は主に文字列、Mahjong (Mortal) は JSON オブジェクトを使用。
    if (
      typeof data !== "string" &&
      (typeof data !== "object" || data === null)
    ) {
      return;
    }

    const input = data as string | Record<string, unknown>;

    const info = this.parser.parseInfo(input);
    if (info) {
      this.infoController?.enqueue(info);
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
      // 2026 Best Practice: 即座に参照をクリアして二重解決を防止
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

  /**
   * 探索コマンドを Worker に送信します。
   */
  protected sendSearchCommand(
    command: string | string[] | Uint8Array | Record<string, unknown>,
  ): void {
    if (Array.isArray(command)) {
      for (const cmd of command) {
        this.communicator?.postMessage(cmd);
      }
    } else if (command instanceof Uint8Array) {
      // 2026 Best Practice: ゼロコピー転送 (Transferable Objects)
      this.communicator?.postMessage(command, [command.buffer]);
    } else {
      this.communicator?.postMessage(command);
    }
  }

  /**
   * Worker にリソースマップを注入します。
   * WASM の相対パス解決（NNUE 等）に使用されます。
   */
  protected async injectResources(resources: ResourceMap): Promise<void> {
    if (!this.communicator) return;

    // 2026 Best Practice: レースコンディション防止のため、注入完了のハンドシェイクを待機
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

  /**
   * 探索を停止します。
   */
  async stop(): Promise<void> {
    if (this.communicator) {
      this.communicator.postMessage(this.parser.createStopCommand());
    }
    this.cleanupPendingTask("Search aborted");
  }

  /**
   * エンジンオプションを設定します。
   */
  async setOption(
    name: string,
    value: string | number | boolean,
  ): Promise<void> {
    if (this._status !== "ready" && this._status !== "busy") {
      const i18nKey = "engine.errors.notReady" as I18nKey;
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
      const i18nKey = "engine.errors.notReady" as I18nKey;
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: "Engine is not loaded",
        engineId: this.id,
        i18nKey,
      });
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
  protected cleanupPendingTask(
    reason?: string,
    skipReadyTransition = false,
  ): void {
    if (this.pendingReject) {
      const i18nKey = "engine.errors.searchAborted" as I18nKey;
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
  public emitTelemetry(event: ITelemetryEvent): void {
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
    this.infoListeners.clear();
    this.resultListeners.clear();
  }
}
