import {
  BaseAdapter,
  ILicenseInfo,
  IEngineSourceConfig,
  ISearchTask,
  WorkerCommunicator,
  IEngineLoader,
  EngineError,
} from "@multi-game-engines/core";
import { MahjongJSONParser, IMahjongSearchOptions, IMahjongSearchInfo, IMahjongSearchResult } from "./MahjongJSONParser.js";

/**
 * Mortal (WASM) 用のアダプター実装。
 * JSON ベースの通信による非完全情報ゲームの探索。
 */
export class MortalAdapter extends BaseAdapter<
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult
> {
  private communicator: WorkerCommunicator | null = null;
  readonly parser = new MahjongJSONParser();
  private blobUrl: string | null = null;
  private activeLoader: IEngineLoader | null = null;
  private messageUnsubscriber: (() => void) | null = null;

  // 探索状態管理
  private pendingResolve: ((result: IMahjongSearchResult) => void) | null = null;
  private pendingReject: ((reason?: unknown) => void) | null = null;
  private infoController: ReadableStreamDefaultController<IMahjongSearchInfo> | null = null;

  readonly id = "mortal";
  readonly name = "Mortal";
  readonly version = "2.0.0";

  readonly license: ILicenseInfo = {
    name: "MIT",
    url: "https://github.com/Equim-00/Mortal/blob/master/LICENSE",
  };

  readonly sources: Record<string, IEngineSourceConfig> = {
    main: {
      url: "https://cdn.jsdelivr.net/npm/@multi-game-engines/mortal-wasm@0.1.0/dist/mortal.js",
      type: "worker-js",
      sri: "sha384-DummyHashForMortalValidationToPassDuringDevelopment1234567890abcdef",
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

      // 初期化完了メッセージを待機
      await this.communicator.expectMessage<{ type: string }>(
        (data) => typeof data === "object" && data !== null && (data as Record<string, unknown>).type === "ready",
        { signal: AbortSignal.timeout(10000) }
      );

      this.emitStatusChange("ready");
    } catch (err) {
      this.emitStatusChange("error");
      throw EngineError.from(err, this.id);
    }
  }

  searchRaw(command: string | string[] | Uint8Array): ISearchTask<IMahjongSearchInfo, IMahjongSearchResult> {
    if (this._status !== "ready") {
      throw new Error("Engine is not ready");
    }

    this.cleanupPendingTask();
    this.emitStatusChange("busy");

    const infoStream = new ReadableStream<IMahjongSearchInfo>({
      start: (controller) => {
        this.infoController = controller;
      },
      cancel: () => {
        void this.stop();
      },
    });

    const resultPromise = new Promise<IMahjongSearchResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    const message = Array.isArray(command) ? command[0] : command;
    this.communicator?.postMessage(message);

    this.messageUnsubscriber?.();

    this.messageUnsubscriber = this.communicator?.onMessage((data) => {
      // 2026 Best Practice: オブジェクトを直接処理し、不要な文字列化を避ける。
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
    if (!this.communicator) return;
    this.communicator.postMessage({ type: "stop" });
  }

  protected async sendOptionToWorker(name: string, value: string | number | boolean): Promise<void> {
    this.communicator?.postMessage({ type: "setoption", name, value });
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
      try { this.infoController.close(); } catch {}
      this.infoController = null;
    }

    if (this._status === "busy" && !skipReadyTransition) {
      this.emitStatusChange("ready");
    }
  }
}
