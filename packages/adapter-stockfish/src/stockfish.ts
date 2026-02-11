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
  EngineErrorCode,
} from "@multi-game-engines/core";

/**
 * Stockfish (WASM) 用のアダプター実装。
 */
export class StockfishAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  readonly id = "stockfish";
  readonly name = "Stockfish via WASM";
  readonly version = "16.1";

  readonly engineLicense: ILicenseInfo = {
    name: "GPL-3.0-only",
    url: "https://stockfishchess.org/",
  };

  readonly adapterLicense: ILicenseInfo = {
    name: "MIT",
    url: "https://opensource.org/licenses/MIT",
  };

  /** エンジンリソースの設定 */
  readonly sources: Record<string, IEngineSourceConfig> = {
    main: {
      url: "https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish.js",
      sri: "", 
      size: 0, 
      type: "worker-js",
    },
  };

  readonly parser = new UCIParser();
  private communicator: WorkerCommunicator | null = null;
  private pendingResolve: ((result: IBaseSearchResult) => void) | null = null;
  private pendingReject: ((reason?: unknown) => void) | null = null;
  private infoController: ReadableStreamDefaultController<IBaseSearchInfo> | null = null;
  private blobUrl: string | null = null;
  private activeLoader: IEngineLoader | null = null;

  async load(loader?: IEngineLoader): Promise<void> {
    if (this._status === "ready") return;

    const startTime = Date.now();
    this.emitStatusChange("loading");
    this.activeLoader = loader || null;

    try {
      let workerUrl = this.sources.main.url;

      if (loader) {
        this.emitProgress({ 
          phase: "downloading", 
          percentage: 10, 
          i18n: { key: "loading_resource", defaultMessage: "Loading engine resource..." } 
        });
        this.blobUrl = await loader.loadResource(this.id, this.sources.main);
        workerUrl = this.blobUrl;
      }

      this.communicator = new WorkerCommunicator(workerUrl);
      await this.communicator.spawn();
      this.communicator.onMessage((data) => this.handleMessage(data));

      this.communicator.postMessage("uci");
      
      const ac = new AbortController();
      const timeoutId = setTimeout(() => ac.abort(), 10000);

      try {
        await this.communicator.expectMessage<string>(
          (data) => typeof data === "string" && data === "uciok", 
          { signal: ac.signal }
        );
      } catch (e) {
        if (ac.signal.aborted) {
          throw new EngineError(EngineErrorCode.SEARCH_TIMEOUT, "UCI initialization timed out");
        }
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }

      this.emitStatusChange("ready");
      this.emitProgress({ phase: "ready", percentage: 100, i18n: { key: "ready", defaultMessage: "Ready" } });
      
      this.emitTelemetry({
        event: "load_complete",
        timestamp: Date.now(),
        attributes: { load_time_ms: Date.now() - startTime, cached: !!this.blobUrl }
      });
    } catch (error) {
      this.emitStatusChange("error");
      if (this.blobUrl && loader) {
        loader.revoke(this.blobUrl);
        this.blobUrl = null;
      }
      throw EngineError.from(error, this.id);
    }
  }

  searchRaw(command: string | string[] | Uint8Array): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    if (this._status !== "ready") {
      throw new Error("Engine is not ready. Call load() first.");
    }

    this.emitStatusChange("busy");

    // 古いリクエストの強制クリーンアップ (consumer 側のハングを防止)
    this.cleanupPendingRequest("New search started");

    const resultPromise = new Promise<IBaseSearchResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    const infoStream = new ReadableStream<IBaseSearchInfo>({
      start: (controller) => {
        this.infoController = controller;
      },
    });

    const infoAsyncIterable: AsyncIterable<IBaseSearchInfo> = {
      [Symbol.asyncIterator]: () => {
        const reader = infoStream.getReader();
        return {
          async next(): Promise<IteratorResult<IBaseSearchInfo>> {
            const { done, value } = await reader.read();
            if (done) return { done: true, value: undefined };
            return { done: false, value: value! };
          },
        };
      },
    };

    if (!this.communicator) {
        throw new EngineError(EngineErrorCode.INTERNAL_ERROR, "Communicator is null");
    }

    if (Array.isArray(command)) {
      command.forEach(cmd => this.communicator?.postMessage(cmd));
    } else {
      this.communicator.postMessage(command);
    }

    return {
      info: infoAsyncIterable,
      result: resultPromise,
      stop: async () => {
        if (this.communicator) {
            this.communicator.postMessage(this.parser.createStopCommand());
        }
      },
    };
  }

  async dispose(): Promise<void> {
    this.cleanupPendingRequest("Adapter disposed");
    
    this.communicator?.terminate();
    this.communicator = null;
    
    if (this.blobUrl && this.activeLoader) {
      this.activeLoader.revoke(this.blobUrl);
      this.blobUrl = null;
    }

    this.emitStatusChange("terminated");
    this.clearListeners();
  }

  /** 待機中の Promise とストリームを確実に終了させる内部メソッド */
  private cleanupPendingRequest(reason: string): void {
    if (this.pendingReject) {
      this.pendingReject(new EngineError(EngineErrorCode.INTERNAL_ERROR, reason));
      this.pendingReject = null;
      this.pendingResolve = null;
    }
    if (this.infoController) {
      try {
        this.infoController.close();
      } catch {
        // 既に閉じられている場合は無視
      }
      this.infoController = null;
    }
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== "string") return;

    const info = this.parser.parseInfo(data);
    if (info) {
      this.infoController?.enqueue(info);
      return;
    }

    const result = this.parser.parseResult(data);
    if (result) {
      this.pendingResolve?.(result);
      this.pendingResolve = null;
      this.pendingReject = null;
      
      try {
        this.infoController?.close();
      } catch { /* ignore */ }
      this.infoController = null;
      
      this.emitStatusChange("ready");
    }
  }
}
