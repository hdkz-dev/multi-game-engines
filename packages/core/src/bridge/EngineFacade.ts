import {
  IEngine,
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  ILoadProgress,
  IMiddleware,
  ISearchTask,
  MiddlewareContext,
  EngineErrorCode,
  IEngineLoader,
  ILicenseInfo,
  IBookAsset,
  EngineTelemetry,
  IEngineError,
  ProgressCallback,
  IEngineConfig,
  EngineLoadingStrategy,
} from "../types.js";
import { EngineError } from "../errors/EngineError.js";
import { ResourceGovernor } from "../capabilities/ResourceGovernor.js";
import { createI18nKey } from "../protocol/ProtocolValidator.js";

/**
 * 2026 Zenith Tier: エンジンの公開 Facade。
 */
export class EngineFacade<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT> {
  private middlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [];
  private currentSearchTask: ISearchTask<T_INFO, T_RESULT> | null = null;
  private currentPositionId: string | null = null;
  private loaderProvider: () => Promise<IEngineLoader>;
  private resolvedLoader: IEngineLoader | null = null;
  private _lastError: EngineError | null = null;
  private loadPromise: Promise<void> | null = null;
  private disposed = false;
  private _internalStatusOverride: EngineStatus | null = null;

  public loadingStrategy?: EngineLoadingStrategy;

  constructor(
    private readonly adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    middlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [],
    loaderProvider?: () => Promise<IEngineLoader>,
  ) {
    this.middlewares = [...middlewares];
    this.loaderProvider =
      loaderProvider ||
      (async () => {
        if (this.resolvedLoader) return this.resolvedLoader;
        const { EngineLoader } = await import("./EngineLoader.js");
        const { IndexedDBStorage } =
          await import("../storage/IndexedDBStorage.js");
        return new EngineLoader(new IndexedDBStorage());
      });

    // アダプターからのイベントをミドルウェアチェーンに流す
    this.adapter.onTelemetry((event) => {
      if (this.disposed) return;
      let processed: EngineTelemetry = event;
      const context = this.createContext({} as T_OPTIONS);
      for (const mw of this.middlewares) {
        try {
          const m = mw as Record<string, unknown>;
          const handler = m["onTelemetry"];
          if (typeof handler === "function") {
            const res = (
              handler as (arg: unknown, ctx: unknown) => unknown
            ).call(mw, processed, context);
            if (res) processed = res as EngineTelemetry;
          }
        } catch {
          /* ignore */
        }
      }
    });

    this.adapter.onInfo?.(async (info) => {
      if (this.disposed) return;

      // 物理的安全なプロパティアクセス
      const infoObj = info as Record<string, unknown>;
      if (
        infoObj &&
        typeof infoObj["positionId"] === "string" &&
        infoObj["positionId"] !== this.currentPositionId
      )
        return;

      let processed: T_INFO = info;
      const context = this.createContext({} as T_OPTIONS);
      for (const mw of this.middlewares) {
        try {
          const m = mw as Record<string, unknown>;
          const handler = m["onInfo"];
          if (typeof handler === "function") {
            const res = await (
              handler as (arg: unknown, ctx: unknown) => unknown
            ).call(mw, processed, context);
            if (res) processed = res as T_INFO;
          }
        } catch {
          /* ignore */
        }
      }
    });

    this.adapter.onSearchResult(async (result) => {
      if (this.disposed) return;
      let processed: T_RESULT = result;
      const context = this.createContext({} as T_OPTIONS);
      for (const mw of this.middlewares) {
        try {
          const m = mw as Record<string, unknown>;
          const handler = m["onResult"];
          if (typeof handler === "function") {
            const res = await (
              handler as (arg: unknown, ctx: unknown) => unknown
            ).call(mw, processed, context);
            if (res) processed = res as T_RESULT;
          }
        } catch {
          /* ignore */
        }
      }
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
    return this._internalStatusOverride || this.adapter.status;
  }
  get engineLicense(): ILicenseInfo {
    return this.adapter.engineLicense;
  }
  get adapterLicense(): ILicenseInfo {
    return this.adapter.adapterLicense;
  }
  get lastError(): IEngineError | null {
    return this._lastError;
  }
  get config(): IEngineConfig | undefined {
    const a = this.adapter as unknown as Record<string, unknown>;
    return a["config"] as IEngineConfig | undefined;
  }

  async load(): Promise<void> {
    if (this.disposed) throw new Error("Object disposed");
    if (this.status === "ready" || this.status === "busy") return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        if (!this.resolvedLoader) {
          this.resolvedLoader = await this.loaderProvider();
        }
        await this.adapter.load(this.resolvedLoader);
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  consent(): void {
    /* protocol */
  }

  async setBook(
    asset: IBookAsset,
    options?: { signal?: AbortSignal; onProgress?: ProgressCallback },
  ): Promise<void> {
    if (this.disposed) throw new Error("Object disposed");
    await this.adapter.setBook(asset, options);
  }

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    if (this.disposed) throw new Error("Object disposed");

    const currentStatus: EngineStatus = this.status;

    if (currentStatus === "busy") {
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: "Engine is busy",
        engineId: this.id,
      });
    }

    if (currentStatus !== "ready") {
      // 2026 Zenith: on-demand または eager の場合は自動ロードを試みる
      if (this.loadingStrategy !== "manual") {
        await this.load();
      } else {
        throw new EngineError({
          code: EngineErrorCode.NOT_READY,
          message: "Engine not ready",
          engineId: this.id,
          i18nKey: createI18nKey("engine.errors.notLoaded"),
        });
      }
    }

    this._internalStatusOverride = "busy";

    try {
      const posId = (options as Record<string, unknown>)["positionId"];
      this.currentPositionId = typeof posId === "string" ? posId : null;

      const recommended = await ResourceGovernor.getRecommendedOptions(
        options as Record<string, unknown>,
      );
      if (this.disposed) {
        throw new EngineError({
          code: EngineErrorCode.CANCELLED,
          message: "Search cancelled due to dispose",
          engineId: this.id,
        });
      }

      const finalOptions = { ...options, ...recommended } as T_OPTIONS;

      let processedOptions = finalOptions;
      const context = this.createContext(processedOptions);
      for (const mw of this.middlewares) {
        const m = mw as Record<string, unknown>;
        try {
          const searchHandler = m["onSearch"];
          if (typeof searchHandler === "function") {
            const res = await (
              searchHandler as (arg: unknown, ctx: unknown) => unknown
            ).call(mw, processedOptions, context);
            if (res) processedOptions = res as T_OPTIONS;
          }
        } catch {
          /* ignore */
        }

        try {
          const commandHandler = m["onCommand"];
          if (typeof commandHandler === "function") {
            await (
              commandHandler as (arg: unknown, ctx: unknown) => unknown
            ).call(mw, processedOptions, context);
          }
        } catch {
          /* ignore */
        }
      }

      if (this.disposed) {
        throw new EngineError({
          code: EngineErrorCode.CANCELLED,
          message: "Search cancelled due to dispose",
          engineId: this.id,
        });
      }

      this.currentSearchTask = this.adapter.searchRaw(
        this.adapter.parser.createSearchCommand(processedOptions),
      );

      const result = await this.currentSearchTask.result;
      if (this.disposed) {
        throw new EngineError({
          code: EngineErrorCode.CANCELLED,
          message: "Search cancelled due to dispose",
          engineId: this.id,
        });
      }

      let processedResult = result;
      for (const mw of this.middlewares) {
        try {
          const m = mw as Record<string, unknown>;
          const handler = m["onResult"];
          if (typeof handler === "function") {
            const res = await (
              handler as (arg: unknown, ctx: unknown) => unknown
            ).call(mw, processedResult, context);
            if (res) processedResult = res as T_RESULT;
          }
        } catch {
          /* ignore */
        }
      }
      return processedResult;
    } catch (err) {
      const error =
        err instanceof EngineError
          ? err
          : new EngineError({
              code: EngineErrorCode.UNKNOWN_ERROR,
              message: String(err),
              engineId: this.id,
            });
      this._lastError = error;
      throw error;
    } finally {
      this._internalStatusOverride = null;
      this.currentSearchTask = null;
    }
  }

  stop(): void {
    if (this.disposed) return;
    void this.adapter.stop();
    this._internalStatusOverride = null;
    this.currentSearchTask = null;
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;

    const loader = this.resolvedLoader || (await this.loaderProvider());
    if (loader) {
      loader.revokeByEngineId(this.id);
      if (this.id.includes("test") && typeof loader.revokeAll === "function") {
        loader.revokeAll();
      }
    }

    if (this.currentSearchTask) {
      void this.adapter.stop();
    }

    void this.adapter.dispose().catch(() => {});

    this.middlewares = [];
    this.currentSearchTask = null;
    this._internalStatusOverride = null;
  }

  use(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>): this {
    this.middlewares.push(middleware);
    return this;
  }

  unuse(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT> | string): this {
    if (typeof middleware === "string") {
      this.middlewares = this.middlewares.filter((m) => {
        const mo = m as unknown as Record<string, unknown>;
        return mo["id"] !== middleware;
      });
    } else {
      this.middlewares = this.middlewares.filter((m) => m !== middleware);
    }
    return this;
  }

  onInfo(callback: (info: T_INFO) => void): () => void {
    const onInfo = this.adapter.onInfo;
    return typeof onInfo === "function"
      ? onInfo.call(this.adapter, callback)
      : () => {};
  }

  onSearchResult(callback: (result: T_RESULT) => void): () => void {
    return this.adapter.onSearchResult(callback);
  }

  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    return this.adapter.onStatusChange(callback);
  }

  onTelemetry(callback: (telemetry: EngineTelemetry) => void): () => void {
    return this.adapter.onTelemetry(callback);
  }

  onProgress(callback: (progress: ILoadProgress) => void): () => void {
    return this.adapter.onProgress(callback);
  }

  emitTelemetry(telemetry: EngineTelemetry): void {
    if (this.disposed) return;
    this.adapter.emitTelemetry(telemetry);
  }

  private createContext(options: T_OPTIONS): MiddlewareContext<T_OPTIONS> {
    return {
      engineId: this.id,
      options,
    };
  }
}
