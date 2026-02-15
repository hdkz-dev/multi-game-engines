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
  EngineErrorCode,
} from "../types.js";

/** 内部ミドルウェアの型定義 ( Zenith Tier ) */
type SafeMiddleware<O> = IMiddleware<O, unknown, unknown, unknown, unknown>;

/**
 * 利用者がエンジンを操作するための Facade 実装。
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
  private _lastError?: {
    message: string;
    code?: EngineErrorCode;
    remediation?: string;
  };

  /** 内部ミドルウェアスタック */
  private middlewares: SafeMiddleware<T_OPTIONS>[] = [];

  constructor(
    private adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    middlewares: SafeMiddleware<T_OPTIONS>[] = [],
    private loaderProvider?: () => Promise<IEngineLoader>,
    private ownsAdapter: boolean = true,
  ) {
    this.middlewares = [...middlewares];
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

  get id(): string {
    return this.adapter.id;
  }
  get name(): string {
    return this.adapter.name;
  }
  get version(): string {
    return this.adapter.version;
  }
  get status(): EngineStatus {
    return this.adapter.status;
  }
  get lastError() {
    return this._lastError;
  }
  get loadingStrategy(): EngineLoadingStrategy {
    return this._loadingStrategy;
  }
  set loadingStrategy(value: EngineLoadingStrategy) {
    this._loadingStrategy = value;
    if (value === "eager" && this.status === "uninitialized") {
      void this.load();
    }
  }

  async load(): Promise<void> {
    if (this.status === "ready" || this.status === "busy") return;
    if (this.loadingPromise) return this.loadingPromise;
    this.loadingPromise = (async () => {
      const loader = this.loaderProvider
        ? await this.loaderProvider()
        : undefined;
      await this.adapter.load(loader);
    })();
    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    if (
      this._loadingStrategy === "on-demand" &&
      this.status === "uninitialized"
    ) {
      await this.load();
    }
    if (this.status !== "ready" && this.status !== "busy") {
      throw new Error(
        `Engine is not initialized (current status: ${this.status})`,
      );
    }
    if (this.activeTask) {
      await this.activeTask.stop();
    }

    const context: IMiddlewareContext<T_OPTIONS> = {
      engineId: this.id,
      options,
      emitTelemetry: (event) => {
        this.emitTelemetry(event);
      },
      telemetryId:
        crypto.randomUUID?.() ??
        `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`,
    };

    let command: unknown = this.adapter.parser.createSearchCommand(options);
    for (const mw of this.middlewares) {
      if (mw.onCommand) {
        const next = await mw.onCommand(command as string, context);
        if (next !== undefined) command = next;
      }
    }

    const task = this.adapter.searchRaw(command as string);
    this.activeTask = task;

    const infoProcessing = (async () => {
      try {
        for await (let info of task.info) {
          for (const mw of this.middlewares) {
            if (mw.onInfo) {
              const processed = await mw.onInfo(info as unknown, context);
              if (processed !== undefined) {
                info = processed as unknown as T_INFO;
              }
            }
          }
          for (const l of this.infoListeners) l(info);
        }
      } catch (err) {
        console.error(
          `[EngineFacade] Info stream processing error (${this.id}):`,
          err,
        );
        this.emitTelemetry({
          type: "error",
          timestamp: Date.now(),
          metadata: {
            engineId: this.id,
            action: "info_stream",
            error: String(err),
          },
        });
      }
    })();

    const onAbort = () => {
      void task.stop();
    };
    try {
      if (options.signal?.aborted) {
        await task.stop();
      }
      options.signal?.addEventListener("abort", onAbort);

      let result: unknown = await task.result;
      this._lastError = undefined;

      for (const mw of this.middlewares) {
        if (mw.onResult) {
          const processed = await mw.onResult(result, context);
          if (processed !== undefined) {
            result = processed;
          }
        }
      }
      await infoProcessing;
      return result as T_RESULT;
    } catch (err: unknown) {
      this._lastError = {
        message: err instanceof Error ? err.message : String(err),
        code: EngineErrorCode.INTERNAL_ERROR,
      };
      throw err;
    } finally {
      options.signal?.removeEventListener("abort", onAbort);
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

  emitTelemetry(event: ITelemetryEvent): void {
    this.adapter.emitTelemetry?.(event);
    for (const l of this.telemetryListeners) l(event);
  }

  use(middleware: SafeMiddleware<T_OPTIONS>): void {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));
  }

  async stop(): Promise<void> {
    if (this.activeTask) {
      await this.activeTask.stop();
      this.activeTask = null;
    }
  }

  async setOption(
    name: string,
    value: string | number | boolean,
  ): Promise<void> {
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
