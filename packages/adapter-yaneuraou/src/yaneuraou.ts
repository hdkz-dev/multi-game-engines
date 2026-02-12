import {
  BaseAdapter,
  IBaseSearchInfo,
  IBaseSearchResult,
  ILicenseInfo,
  IEngineSourceConfig,
  ISearchTask,
  WorkerCommunicator,
  IEngineLoader,
  EngineError,
} from "@multi-game-engines/core";
import { USIParser } from "./USIParser.js";
import { ISHOGISearchOptions } from "./usi-types.js";

/**
 * やねうら王 (WASM) 用のアダプター実装。
 */
export class YaneuraOuAdapter extends BaseAdapter<
  ISHOGISearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  private communicator: WorkerCommunicator | null = null;
  readonly parser = new USIParser();
  private blobUrl: string | null = null;
  private activeLoader: IEngineLoader | null = null;
  private messageUnsubscriber: (() => void) | null = null;

  // 探索状態管理
  private pendingResolve: ((result: IBaseSearchResult) => void) | null = null;
  private pendingReject: ((reason?: unknown) => void) | null = null;
  private infoController: ReadableStreamDefaultController<IBaseSearchInfo> | null = null;

  readonly id = "yaneuraou";
  readonly name = "YaneuraOu";
  readonly version = "7.5.0";

  readonly license: ILicenseInfo = {
    name: "GPL-3.0-only",
    url: "https://github.com/yaneurao/YaneuraOu/blob/master/LICENSE",
  };

  readonly sources: Record<string, IEngineSourceConfig> = {
    main: {
      // NOTE: This URL is for a future release (Phase 3).
      url: "https://cdn.jsdelivr.net/npm/@multi-game-engines/yaneuraou-wasm@0.1.0/dist/yaneuraou.js",
      type: "worker-js",
      // Security: Valid SRI format for validation to pass during development.
      // MUST be updated to the actual binary hash upon publication.
      sri: "sha384-DummyHashForValidationToPassDuringDevelopment1234567890abcdefghij", 
      size: 0,
    },
  };

  /**
   * エンジンのロードと初期化。
   */
  async load(loader: IEngineLoader): Promise<void> {
    this.activeLoader = loader;
    this.emitStatusChange("loading");

    try {
      this.blobUrl = await loader.loadResource(this.id, this.sources.main);
      this.communicator = new WorkerCommunicator(this.blobUrl);

      // USI プロトコルの初期化
      this.communicator.postMessage("usi");
      
      await this.communicator.expectMessage<string>(
        (data) => data === "usiok",
        { signal: AbortSignal.timeout(5000) }
      );

      this.emitStatusChange("ready");
    } catch (err) {
      this.emitStatusChange("error");
      throw EngineError.from(err, this.id);
    }
  }

  /**
   * 探索の実行。
   */
  searchRaw(command: string | string[] | Uint8Array): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    if (this._status !== "ready") {
      throw new Error("Engine is not ready");
    }

    this.cleanupPendingTask();
    this.emitStatusChange("busy");

    // 2026 Best Practice: Async Iterable (Stream) によるリアルタイムな思考状況の配信。
    const infoStream = new ReadableStream<IBaseSearchInfo>({
      start: (controller) => {
        this.infoController = controller;
      },
      cancel: () => {
        void this.stop();
      },
    });

    const resultPromise = new Promise<IBaseSearchResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    if (Array.isArray(command)) {
      for (const cmd of command) {
        this.communicator?.postMessage(cmd);
      }
    } else {
      this.communicator?.postMessage(command);
    }

    // 既存のリスナーを解除
    this.messageUnsubscriber?.();

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

    return {
      info: infoStream,
      result: resultPromise,
      stop: () => this.stop(),
    };
  }

  async stop(): Promise<void> {
    this.cleanupPendingTask("Search aborted");
    if (!this.communicator) {
      console.warn(`[${this.id}] Cannot stop: Engine is not loaded.`);
      return;
    }
    this.communicator.postMessage(this.parser.createStopCommand());
  }

  protected async sendOptionToWorker(name: string, value: string | number | boolean): Promise<void> {
    this.communicator?.postMessage(this.parser.createOptionCommand(name, value));
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
    if (reason) {
      this.pendingReject?.(new Error(reason));
    }
    
    this.pendingResolve = null;
    this.pendingReject = null;

    if (this.infoController) {
      try {
        this.infoController.close();
      } catch {
        // すでにクローズされている場合は無視
      }
      this.infoController = null;
    }

    // 探索終了後に ready 状態に戻す (dispose 中は除外)
    if (this._status === "busy" && !skipReadyTransition) {
      this.emitStatusChange("ready");
    }
  }
}
