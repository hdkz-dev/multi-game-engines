import {
  IEngine,
  IEngineAdapter,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IMiddleware,
  ISearchTask,
  IMiddlewareContext,
} from "../types";

/**
 * 利用者がエンジンを操作するための Facade 実装。
 */
export class EngineFacade<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT> {
  private activeTask: ISearchTask<T_INFO, T_RESULT> | null = null;
  private infoListeners = new Set<(info: T_INFO) => void>();
  private isDisposed = false;
  private _loadingStrategy: EngineLoadingStrategy = "on-demand";

  /** 2026 Best Practice: ロード戦略の管理 */
  get loadingStrategy(): EngineLoadingStrategy {
    return this._loadingStrategy;
  }

  set loadingStrategy(value: EngineLoadingStrategy) {
    this._loadingStrategy = value;
    if (value === "eager" && this.status === "uninitialized") {
      void this.load();
    }
  }

  constructor(
    private readonly adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    private readonly middlewares: IMiddleware<T_INFO, T_RESULT>[] = []
  ) {}

  get id(): string { return this.adapter.id; }
  get name(): string { return this.adapter.name; }
  get version(): string { return this.adapter.version; }

  get status(): EngineStatus {
    return this.adapter.status;
  }

  async load(): Promise<void> {
    await this.adapter.load();
  }

  /**
   * 探索を実行します。
   */
  async search(options: T_OPTIONS): Promise<T_RESULT> {
    if (this.isDisposed) throw new Error("Facade is disposed");

    // 2026 Best Practice: ロード戦略に基づいた自動ロード処理
    if (this.status === "uninitialized" || this.status === "error") {
      if (this.loadingStrategy === "on-demand") {
        await this.load();
      } else if (this.loadingStrategy === "manual") {
        throw new Error("Engine is not initialized. Call load() first or use 'on-demand' strategy.");
      }
    }

    // ロード中（loading）の場合は完了を待機
    if (this.status === "loading") {
      await new Promise<void>((resolve, reject) => {
        const unsub = this.onStatusChange((status) => {
          if (status === "ready") {
            unsub();
            resolve();
          } else if (status === "error" || status === "terminated") {
            unsub();
            reject(new Error(`Engine failed to load: ${status}`));
          }
        });
      });
    }

    await this.stop();

    const context: IMiddlewareContext<T_OPTIONS> = {
      engineId: this.id,
      options,
    };

    let command = this.adapter.parser.createSearchCommand(options);
    for (const mw of this.middlewares) {
      if (mw.onCommand) {
        command = await mw.onCommand(command, context);
      }
    }

    const task = this.adapter.searchRaw(command);
    this.activeTask = task;

    // 非同期で Info ストリームの配信を開始 (2026 Best Practice: Background streaming)
    void this.pipeInfoStream(task, options);

    try {
      let result = await task.result;
      for (const mw of this.middlewares) {
        if (mw.onResult) {
          result = await mw.onResult(result, context);
        }
      }
      return result;
    } finally {
      if (this.activeTask === task) {
        this.activeTask = null;
      }
    }
  }

  /**
   * Info ストリームを登録済みのリスナーに配信します。
   * 
   * 2026 Best Practice: Persistent Listener Pattern.
   * 利用者は一度 onInfo を登録すれば、探索（search）が新しく実行されても
   * 継続して最新の思考状況を受け取ることができます。
   */
  private async pipeInfoStream(task: ISearchTask<T_INFO, T_RESULT>, options: T_OPTIONS): Promise<void> {
    const context: IMiddlewareContext<T_OPTIONS> = {
      engineId: this.id,
      options,
    };

    try {
      // Async Iterator を使用して、アダプターからの info を順次処理
      for await (let info of task.info) {
        // Facade が破棄されたか、別の新しいタスクが開始された場合はループを終了
        if (this.isDisposed || this.activeTask !== task) break;

        // ミドルウェアの適用 (Bidirectional Middleware)
        for (const mw of this.middlewares) {
          if (mw.onInfo) {
            info = await mw.onInfo(info, context);
          }
        }

        // 登録済みの全リスナーへ通知
        for (const listener of this.infoListeners) {
          listener(info);
        }
      }
    } catch (err) {
      if (!this.isDisposed && this.activeTask === task) {
        console.error("[EngineFacade] Info stream error:", err);
      }
    }
  }

  /**
   * 思考状況を購読します。
   */
  onInfo(callback: (info: T_INFO) => void): () => void {
    this.infoListeners.add(callback);
    return () => this.infoListeners.delete(callback);
  }

  /**
   * エンジンの状態変化を購読します。
   */
  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    return this.adapter.onStatusChange(callback);
  }

  /**
   * ロードの進捗状況を購読します。
   */
  onProgress(callback: (progress: ILoadProgress) => void): () => void {
    return this.adapter.onProgress(callback);
  }

  /**
   * テレメトリイベントを購読します。
   */
  onTelemetry(callback: (event: ITelemetryEvent) => void): () => void {
    return this.adapter.onTelemetry?.(callback) || (() => {});
  }

  async stop(): Promise<void> {
    if (this.activeTask) {
      await this.activeTask.stop();
      this.activeTask = null;
    }
  }

  async dispose(): Promise<void> {
    this.isDisposed = true;
    this.infoListeners.clear();
    await this.stop();
    await this.adapter.dispose();
  }
}
