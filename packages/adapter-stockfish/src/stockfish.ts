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
 * 
 * EngineLoader を介して CDN (jsDelivr 等) から WASM エンジンを取得し、
 * WebWorker 内で実行、UCI プロトコルで通信を行います。
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

  /** エンジンリソースの設定。Stage 1 ではパブリック CDN を参照します。 */
  readonly sources: Record<string, IEngineSourceConfig> = {
    main: {
      url: "https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish.js",
      // 実運用時には正確なハッシュ値を指定して改竄を防止します。
      sri: "", 
      size: 0,
      type: "worker-js",
    },
  };

  readonly parser = new UCIParser();
  private communicator: WorkerCommunicator | null = null;
  private pendingResolve: ((result: IBaseSearchResult) => void) | null = null;
  private infoController: ReadableStreamDefaultController<IBaseSearchInfo> | null = null;
  private blobUrl: string | null = null;
  private activeLoader: IEngineLoader | null = null;

  /**
   * エンジンをロードし、準備完了状態にします。
   */
  async load(loader?: IEngineLoader): Promise<void> {
    if (this._status === "ready") return;

    const startTime = Date.now();
    this.emitStatusChange("loading");
    this.activeLoader = loader || null;

    try {
      let workerUrl = this.sources.main.url;

      // ブリッジからローダーが提供されている場合は、SRI検証とキャッシュを利用する
      if (loader) {
        this.emitProgress({ 
          phase: "downloading", 
          percentage: 10, 
          i18n: { key: "loading_resource", defaultMessage: "Loading engine resource..." } 
        });
        this.blobUrl = await loader.loadResource(this.id, this.sources.main);
        workerUrl = this.blobUrl;
      }

      // WebWorker を起動し、通信路を確立
      this.communicator = new WorkerCommunicator(workerUrl);
      await this.communicator.spawn();
      this.communicator.onMessage((data) => this.handleMessage(data));

      // エンジンのプロトコル（UCI）初期化
      this.communicator.postMessage("uci");
      
      // 'uciok' が返るのを待つ（最大10秒のタイムアウト）
      await Promise.race([
        this.communicator.expectMessage<string>((data) => data === "uciok"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("UCI initialization timeout")), 10000))
      ]);

      this.emitStatusChange("ready");
      this.emitProgress({ 
        phase: "ready", 
        percentage: 100, 
        i18n: { key: "ready", defaultMessage: "Ready" } 
      });
      
      // 統計情報の収集
      this.emitTelemetry({
        event: "load_complete",
        timestamp: Date.now(),
        attributes: { load_time_ms: Date.now() - startTime, cached: !!this.blobUrl }
      });
    } catch (error) {
      this.emitStatusChange("error");
      
      // 途中でエラーが起きた場合、Blob URL がリークしないように確実に解放する
      if (this.blobUrl && loader) {
        loader.revoke(this.blobUrl);
        this.blobUrl = null;
      }

      throw EngineError.from(error, this.id);
    }
  }

  /**
   * 未加工のプロトコルコマンドを使用して探索を実行します。
   */
  searchRaw(command: string | Uint8Array): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    if (this._status !== "ready") {
      throw new Error("Engine is not ready. Call load() first.");
    }

    this.emitStatusChange("busy");

    // 結果返却用の Promise
    const resultPromise = new Promise<IBaseSearchResult>((resolve) => {
      this.pendingResolve = resolve;
    });

    // 思考状況（info）ストリーミング用の ReadableStream
    const infoStream = new ReadableStream<IBaseSearchInfo>({
      start: (controller) => {
        this.infoController = controller;
      },
    });

    // AsyncIterable として公開
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

    // エンジンに探索コマンドを送信
    this.communicator?.postMessage(command);

    return {
      info: infoAsyncIterable,
      result: resultPromise,
      stop: async () => {
        // 探索停止コマンドを送信
        this.communicator?.postMessage(this.parser.createStopCommand());
      },
    };
  }

  /**
   * エンジンを完全に停止し、リソースを解放します。
   */
  async dispose(): Promise<void> {
    this.communicator?.terminate();
    this.communicator = null;
    
    // 生成された Blob URL を解放
    if (this.blobUrl && this.activeLoader) {
      this.activeLoader.revoke(this.blobUrl);
      this.blobUrl = null;
    }

    this.emitStatusChange("terminated");
    this.clearListeners();
  }

  /**
   * Worker からのメッセージを処理します。
   */
  private handleMessage(data: unknown): void {
    if (typeof data !== "string") return;

    // 1. info メッセージのパース
    const info = this.parser.parseInfo(data);
    if (info) {
      this.infoController?.enqueue(info);
      return;
    }

    // 2. bestmove メッセージのパース（探索完了）
    const result = this.parser.parseResult(data);
    if (result) {
      this.pendingResolve?.(result);
      this.pendingResolve = null;
      this.infoController?.close();
      this.infoController = null;
      this.emitStatusChange("ready");
    }
  }
}
