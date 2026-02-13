import {
  BaseAdapter,
  ILicenseInfo,
  IEngineSourceConfig,
  ISearchTask,
  WorkerCommunicator,
  IEngineLoader,
  EngineError,
  EngineErrorCode,
} from "@multi-game-engines/core";
import { EdaxParser, IOthelloSearchOptions, IOthelloSearchInfo, IOthelloSearchResult } from "./EdaxParser.js";

/**
 * Edax (WASM) 用のアダプター実装。
 */
export class EdaxAdapter extends BaseAdapter<
  IOthelloSearchOptions,
  IOthelloSearchInfo,
  IOthelloSearchResult
> {
  private communicator: WorkerCommunicator | null = null;
  readonly parser = new EdaxParser();
  private blobUrl: string | null = null;
  private activeLoader: IEngineLoader | null = null;
  private messageUnsubscriber: (() => void) | null = null;

  // 探索状態管理
  private pendingResolve: ((result: IOthelloSearchResult) => void) | null = null;
  private pendingReject: ((reason?: unknown) => void) | null = null;
  private infoController: ReadableStreamDefaultController<IOthelloSearchInfo> | null = null;

  readonly id = "edax";
  readonly name = "Edax";
  readonly version = "4.4.0";

  readonly license: ILicenseInfo = {
    name: "GPL-3.0-only",
    url: "https://github.com/abulmo/edax-reversi/blob/master/LICENSE",
  };

  readonly sources: Record<string, IEngineSourceConfig> = {
    main: {
      // NOTE: 2026年時点の公開 WASM バイナリを想定
      url: "https://cdn.jsdelivr.net/npm/@multi-game-engines/edax-wasm@0.1.0/dist/edax.js",
      type: "worker-js",
      // TODO: Replace with actual SRI hash before production release
      sri: "sha384-DummyHashForEdaxValidationToPassDuringDevelopment1234567890abcdef",
      size: 0,
    },
  };

  /**
   * エンジンのロードと初期化。
   */
  async load(loader: IEngineLoader): Promise<void> {
    if (!loader) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, "Loader is required for EdaxAdapter", this.id);
    }
    this.activeLoader = loader;
    this.emitStatusChange("loading");

    try {
      this.blobUrl = await loader.loadResource(this.id, this.sources.main);
      this.communicator = new WorkerCommunicator(this.blobUrl);

      // Edax は起動直後に何らかの応答を返すことを期待
      // (ここではダミーの ready チェック)
      this.communicator.postMessage("v"); // version check
      
      await this.communicator.expectMessage<string>(
        (data) => typeof data === "string" && data.toLowerCase().includes("edax"),
        { signal: AbortSignal.timeout(5000) }
      );

      this.emitStatusChange("ready");
    } catch (err) {
      this.emitStatusChange("error");
      throw EngineError.from(err, this.id);
    }
  }

  searchRaw(command: string | string[] | Uint8Array | Record<string, unknown>): ISearchTask<IOthelloSearchInfo, IOthelloSearchResult> {
    if (this._status !== "ready") {
      throw new EngineError(EngineErrorCode.NOT_READY, "Engine is not ready", this.id);
    }

    this.cleanupPendingTask("Replaced by new search");
    this.emitStatusChange("busy");

    const infoStream = new ReadableStream<IOthelloSearchInfo>({
      start: (controller) => {
        this.infoController = controller;
      },
      cancel: () => {
        void this.stop();
      },
    });

    const resultPromise = new Promise<IOthelloSearchResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    this.messageUnsubscriber?.();

    // 2026 Best Practice: 応答の取りこぼしを防ぐため、送信前にリスナーを登録
    this.messageUnsubscriber = this.communicator?.onMessage((data) => {
      if (typeof data !== "string") return;

      const info = this.parser.parseInfo(data);
      if (info) {
        this.infoController?.enqueue(info);
      }

      const result = this.parser.parseResult(data);
      if (result) {
        this.pendingResolve?.(result);
        this.cleanupPendingTask();
      }
    }) || null;

    if (Array.isArray(command)) {
      for (const cmd of command) {
        this.communicator?.postMessage(cmd);
      }
    } else {
      this.communicator?.postMessage(command);
    }

    return {
      info: infoStream,
      result: resultPromise,
      stop: () => this.stop(),
    };
  }

  async stop(): Promise<void> {
    this.cleanupPendingTask("Search aborted");
    if (!this.communicator) return;
    this.communicator.postMessage(this.parser.createStopCommand());
  }

  protected async sendOptionToWorker(name: string, value: string | number | boolean): Promise<void> {
    if (!this.communicator) {
      throw new EngineError(EngineErrorCode.NOT_READY, "Engine is not loaded", this.id);
    }
    this.communicator.postMessage(this.parser.createOptionCommand(name, value));
  }

  async dispose(): Promise<void> {
    this.cleanupPendingTask("Adapter disposed", true);
    this.messageUnsubscriber?.();
    this.messageUnsubscriber = null;
    this.communicator?.terminate();
    this.communicator = null;
    
    if (this.blobUrl && this.activeLoader) {
      this.activeLoader.revoke(this.blobUrl);
    }
    this.blobUrl = null;
    this.emitStatusChange("terminated");
    this.clearListeners();
  }

  private cleanupPendingTask(reason?: string, skipReadyTransition = false): void {
    if (this.pendingReject) {
      this.pendingReject(new Error(reason ?? "Task cleaned up"));
    }
    this.pendingResolve = null;
    this.pendingReject = null;

    if (this.infoController) {
      try {
        this.infoController.close();
      } catch {
        // Ignore error
      }
      this.infoController = null;
    }

    if (this._status === "busy" && !skipReadyTransition) {
      this.emitStatusChange("ready");
    }
  }
}
