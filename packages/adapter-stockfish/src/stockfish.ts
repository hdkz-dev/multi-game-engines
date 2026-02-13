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
import { UCIParser, IChessSearchOptions, IChessSearchInfo, IChessSearchResult } from "./UCIParser.js";

/**
 * Stockfish (WASM) 用のアダプター実装。
 */
export class StockfishAdapter extends BaseAdapter<
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult
> {
  private communicator: WorkerCommunicator | null = null;
  readonly parser = new UCIParser();
  private blobUrl: string | null = null;
  private activeLoader: IEngineLoader | null = null;
  private messageUnsubscriber: (() => void) | null = null;

  // 探索状態管理
  private pendingResolve: ((result: IChessSearchResult) => void) | null = null;
  private pendingReject: ((reason?: unknown) => void) | null = null;
  private infoController: ReadableStreamDefaultController<IChessSearchInfo> | null = null;

  readonly id = "stockfish";
  readonly name = "Stockfish";
  readonly version = "16.1";

  readonly license: ILicenseInfo = {
    name: "GPL-3.0-only",
    url: "https://github.com/official-stockfish/Stockfish/blob/master/LICENSE",
  };

  readonly sources: Record<string, IEngineSourceConfig> = {
    main: {
      url: "https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish.js",
      type: "worker-js",
      // Security: VALID SHA-384 hash for Stockfish 16.1.0 (verified 2026-02-11)
      // TODO: Re-verify SRI hash before production release
      sri: "sha384-EUJMxvxCASaeLnRP7io1aDfkBp2KloJPummBkV0HAQcG4B+4mCEYqP1Epy2E8ocv", 
      size: 38415,
    },
  };

  /**
   * エンジンのロードと初期化。
   */
  async load(loader: IEngineLoader): Promise<void> {
    if (!loader) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, "Loader is required for StockfishAdapter", this.id);
    }
    this.activeLoader = loader;
    this.emitStatusChange("loading");

    try {
      this.blobUrl = await loader.loadResource(this.id, this.sources.main);
      this.communicator = new WorkerCommunicator(this.blobUrl);

      // UCI プロトコルの初期化
      this.communicator.postMessage("uci");
      
      // 2026 Best Practice: AbortSignal.timeout によるクリーンなタイムアウト制御
      await this.communicator.expectMessage<string>(
        (data) => data === "uciok",
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
  searchRaw(command: string | string[] | Uint8Array | Record<string, unknown>): ISearchTask<IChessSearchInfo, IChessSearchResult> {
    if (this._status !== "ready") {
      throw new EngineError(EngineErrorCode.NOT_READY, "Engine is not ready", this.id);
    }

    this.cleanupPendingTask("Replaced by new search");
    this.emitStatusChange("busy");

    // 2026 Best Practice: Async Iterable (Stream) によるリアルタイムな思考状況の配信。
    const infoStream = new ReadableStream<IChessSearchInfo>({
      start: (controller) => {
        this.infoController = controller;
      },
      cancel: () => {
        // 利用者がストリームの購読を中止した場合、エンジンにも停止コマンドを送信。
        void this.stop();
      },
    });

    const resultPromise = new Promise<IChessSearchResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    // 既存のリスナーを解除 (2026 Best Practice: Task-scoped listener management)
    // 以前の探索タスクのレスポンスが現在のタスクに混入することを防止。
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
    if (!this.communicator) {
      console.warn(`[${this.id}] Cannot stop: Engine is not loaded.`);
      return;
    }
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
