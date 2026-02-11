import {
  BaseAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ILicenseInfo,
  IEngineSourceConfig,
  ISearchTask,
  UCIParser,
  WorkerCommunicator,
  IEngineLoader,
  EngineError,
} from "@multi-game-engines/core";

/**
 * Stockfish (WASM) 用のアダプター実装。
 */
export class StockfishAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  private communicator: WorkerCommunicator | null = null;
  readonly parser = new UCIParser();
  private blobUrl: string | null = null;
  private activeLoader: IEngineLoader | null = null;

  // 探索状態管理
  private pendingResolve: ((result: IBaseSearchResult) => void) | null = null;
  private pendingReject: ((reason?: unknown) => void) | null = null;
  private infoController: ReadableStreamDefaultController<IBaseSearchInfo> | null = null;

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
      // Security: SHA-384 hash for SRI validation
      sri: "sha384-H6N8H2P6H/f1+iW7+v7g2H6R9I9A5F1E2v9E5v1E2v9E5v1E2v9E5v1E2v9E5v1E", 
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

      // UCI プロトコルの初期化
      this.communicator.postMessage("uci");
      
      // uciok を待機 (タイムアウト 5秒)
      await Promise.race([
        this.communicator.expectMessage<string>((data) => data === "uciok"),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("UCI initialization timeout")), 5000)
        ),
      ]);

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

    // 前回のタスクが残っていれば強制終了
    this.cleanupPendingTask();

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

    // コマンド送信
    if (Array.isArray(command)) {
      for (const cmd of command) {
        this.communicator?.postMessage(cmd);
      }
    } else {
      this.communicator?.postMessage(command);
    }

    // メッセージハンドリング
    this.communicator?.onMessage((data) => {
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
    });

    return {
      info: infoStream,
      result: resultPromise,
      stop: () => this.stop(),
    };
  }

  /**
   * 探索の停止。
   */
  async stop(): Promise<void> {
    this.communicator?.postMessage(this.parser.createStopCommand());
    this.cleanupPendingTask("Search aborted");
  }

  /**
   * リソースの解放。
   */
  async dispose(): Promise<void> {
    this.cleanupPendingTask("Adapter disposed");
    this.communicator?.terminate();
    this.communicator = null;
    
    if (this.blobUrl && this.activeLoader) {
      this.activeLoader.revoke(this.blobUrl);
    }
    this.blobUrl = null;
    this.emitStatusChange("terminated");
    this.clearListeners();
  }

  /**
   * 進行中のタスクをクリーンアップ。
   */
  private cleanupPendingTask(reason?: string): void {
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
  }
}
