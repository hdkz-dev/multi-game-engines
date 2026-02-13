import {
  IEngine,
  IEngineAdapter,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ISearchTask,
  IMiddleware,
  IMiddlewareContext,
  EngineLoadingStrategy,
  IEngineLoader,
} from "../types.js";
import { BaseAdapter } from "../adapters/BaseAdapter.js";

/**
 * 利用者がエンジンを操作するための Facade 実装。
 * ミドルウェアの適用、ライフサイクル管理、自動ロードなどを抽象化します。
 */
export class EngineFacade<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT> {
  private statusListeners = new Set<(status: EngineStatus) => void>();
  private progressListeners = new Set<(progress: ILoadProgress) => void>();
  private telemetryListeners = new Set<(event: ITelemetryEvent) => void>();
  private infoListeners = new Set<(info: T_INFO) => void>();

  private _loadingStrategy: EngineLoadingStrategy = "on-demand";
  private loadingPromise: Promise<void> | null = null;
  private activeTask: ISearchTask<T_INFO, T_RESULT> | null = null;

  constructor(
    private adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    private middlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [],
    private loaderProvider?: () => Promise<IEngineLoader>,
    private ownsAdapter: boolean = true
  ) {
    // アダプターからのイベントを委譲
    this.adapter.onStatusChange((s) => {
      for (const l of this.statusListeners) l(s);
    });
    this.adapter.onProgress((p) => {
      for (const l of this.progressListeners) l(p);
    });
    this.adapter.onTelemetry?.((e) => {
      for (const l of this.telemetryListeners) l(e);
    });
  }

  get id(): string { return this.adapter.id; }
  get name(): string { return this.adapter.name; }
  get version(): string { return this.adapter.version; }
  get status(): EngineStatus { return this.adapter.status; }

  get loadingStrategy(): EngineLoadingStrategy { return this._loadingStrategy; }
  set loadingStrategy(value: EngineLoadingStrategy) {
    this._loadingStrategy = value;
    if (value === "eager" && this.status === "uninitialized") {
      void this.load();
    }
  }

  async load(): Promise<void> {
    // 2026 Best Practice: 冪等性の確保 (既にロード済みまたはロード中の場合は何もしない)
    if (this.status === "ready" || this.status === "busy") return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const loader = this.loaderProvider ? await this.loaderProvider() : undefined;
      await this.adapter.load(loader);
    })();

    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    // 自動ロード
    if (this._loadingStrategy === "on-demand" && this.status === "uninitialized") {
      await this.load();
    }

    if (this.status !== "ready" && this.status !== "busy") {
      throw new Error(`Engine is not initialized (current status: ${this.status})`);
    }

    // 既存タスクがあれば停止
    if (this.activeTask) {
      await this.activeTask.stop();
    }

    const context: IMiddlewareContext<T_OPTIONS> = {
      engineId: this.id,
      options,
      emitTelemetry: (event) => {
        this.adapter.emitTelemetry?.(event);
      }
    };

    // 1. コマンド生成
    let command = this.adapter.parser.createSearchCommand(options);

    // 2. onCommand ミドルウェアの適用
    for (const mw of this.middlewares) {
      if (mw.onCommand) {
        command = await mw.onCommand(command, context);
      }
    }

    // 3. 探索実行
    const task = this.adapter.searchRaw(command);
    this.activeTask = task;

    // 4. 思考情報のストリーミング (Persistent Listener + Middleware)
    const infoProcessing = (async () => {
      try {
        for await (let info of task.info) {
          // onInfo ミドルウェアの適用
          for (const mw of this.middlewares) {
            if (mw.onInfo) {
              info = await mw.onInfo(info, context);
            }
          }
          // 購読者に通知
          for (const l of this.infoListeners) l(info);
        }
      } catch (err) {
        // 2026 Best Practice: アダプターの emitTelemetry を呼び出す
        this.adapter.emitTelemetry?.({
          type: "error",
          timestamp: Date.now(),
          metadata: { 
            action: "info_stream",
            error: String(err) 
          }
        });
      }
    })();

    // 5. 結果の待機と onResult ミドルウェアの適用
    try {
      if (options.signal?.aborted) {
        await task.stop();
      }
      
      options.signal?.addEventListener("abort", () => {
        void task.stop();
      });

      let result = await task.result;
      for (const mw of this.middlewares) {
        if (mw.onResult) {
          result = await mw.onResult(result, context);
        }
      }
      await infoProcessing;
      return result;
    } finally {
      if (this.activeTask === task) {
        this.activeTask = null;
      }
    }
  }

  onInfo(callback: (info: T_INFO) => void): () => void {
    this.infoListeners.add(callback);
    return () => this.infoListeners.delete(callback);
  }

  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onProgress(callback: (progress: ILoadProgress) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  onTelemetry(callback: (event: ITelemetryEvent) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  async stop(): Promise<void> {
    if (this.activeTask) {
      await this.activeTask.stop();
      this.activeTask = null;
    }
  }

  async setOption(name: string, value: string | number | boolean): Promise<void> {
    await this.adapter.setOption(name, value);
  }

  async dispose(): Promise<void> {
    await this.stop();
    this.statusListeners.clear();
    this.progressListeners.clear();
    this.telemetryListeners.clear();
    this.infoListeners.clear();
    
    if (this.ownsAdapter) {
      await this.adapter.dispose();
    }
  }
}
