import {
  IEngine,
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
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

/**
 * 2026 Zenith Tier: エンジンの公開 Facade。
 */
export class EngineFacade<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT>
{
  private middlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [];
  private currentSearchTask: ISearchTask<T_INFO, T_RESULT> | null = null;
  private currentPositionId: string | null = null;
  private loaderProvider: () => Promise<IEngineLoader>;
  private _lastError: EngineError | null = null;

  public loadingStrategy?: EngineLoadingStrategy;

  constructor(
    private readonly adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    middlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [],
    loaderProvider?: () => Promise<IEngineLoader>
  ) {
    this.middlewares = [...middlewares];
    this.loaderProvider = loaderProvider || (async () => {
      const { EngineLoader } = await import("./EngineLoader.js");
      const { IndexedDBStorage } = await import("../storage/IndexedDBStorage.js");
      return new EngineLoader(new IndexedDBStorage());
    });

    // アダプターからのイベントをミドルウェアチェーンに流す
    this.adapter.onTelemetry((event) => {
      let processed: EngineTelemetry = event;
      const context = this.createContext({} as T_OPTIONS);
      for (const mw of this.middlewares) {
        const m = mw as any;
        if (m && typeof m.onTelemetry === "function") {
          processed = m.onTelemetry(processed, context) || processed;
        }
      }
    });

    this.adapter.onInfo?.(async (info) => {
      const infoAny = info as any;
      if (infoAny && infoAny.positionId && infoAny.positionId !== this.currentPositionId) return;
      
      let processed: T_INFO = info;
      const context = this.createContext({} as T_OPTIONS);
      for (const mw of this.middlewares) {
        const m = mw as any;
        if (m && typeof m.onInfo === "function") {
          processed = (await m.onInfo(processed, context)) || processed;
        }
      }
    });

    this.adapter.onSearchResult(async (result) => {
      let processed: T_RESULT = result;
      const context = this.createContext({} as T_OPTIONS);
      for (const mw of this.middlewares) {
        const m = mw as any;
        if (m && typeof m.onResult === "function") {
          processed = (await m.onResult(processed, context)) || processed;
        }
      }
    });
  }

  get id(): string { return this.adapter.id; }
  get name(): string { return this.adapter.name; }
  get version(): string { return this.adapter.version; }
  get status(): EngineStatus { return this.adapter.status; }
  get lastError(): IEngineError | null { return this._lastError; }
  get config(): IEngineConfig | undefined { return (this.adapter as any).config; }

  async load(): Promise<void> {
    const loader = await this.loaderProvider();
    await this.adapter.load(loader);
  }

  consent(): void {
    // 物理的な同意プロトコルの実装（必要に応じて）
  }

  async setBook(
    asset: IBookAsset,
    options?: { signal?: AbortSignal; onProgress?: ProgressCallback },
  ): Promise<void> {
    await this.adapter.setBook(asset, options);
  }

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    if (this.status === "busy") {
      throw new EngineError({ code: EngineErrorCode.NOT_READY, message: "Engine is busy", engineId: this.id });
    }

    this.currentPositionId = (options.positionId as string) || null;
    
    const recommended = await ResourceGovernor.getRecommendedOptions(options as Record<string, unknown>);
    const finalOptions = { ...options, ...recommended } as T_OPTIONS;

    let processedOptions = finalOptions;
    const context = this.createContext(processedOptions);
    for (const mw of this.middlewares) {
      const m = mw as any;
      if (m && typeof m.onSearch === "function") {
        processedOptions = (await m.onSearch(processedOptions, context)) || processedOptions;
      }
    }

    this.currentSearchTask = this.adapter.searchRaw(this.adapter.parser.createSearchCommand(processedOptions));
    
    try {
      const result = await this.currentSearchTask.result;
      let processedResult = result;
      for (const mw of this.middlewares) {
        const m = mw as any;
        if (m && typeof m.onResult === "function") {
          processedResult = (await m.onResult(processedResult, context)) || processedResult;
        }
      }
      return processedResult;
    } catch (err) {
      const error = err instanceof EngineError ? err : new EngineError({ 
        code: EngineErrorCode.UNKNOWN_ERROR, 
        message: String(err), 
        engineId: this.id 
      });
      this._lastError = error;
      throw error;
    } finally {
      this.currentSearchTask = null;
    }
  }

  stop(): void {
    void this.adapter.stop();
    this.currentSearchTask = null;
  }

  async dispose(): Promise<void> {
    await this.adapter.dispose();
    const loader = await this.loaderProvider();
    loader.revokeByEngineId(this.id);
  }

  use(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>): this {
    this.middlewares.push(middleware);
    return this;
  }

  unuse(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT> | string): this {
    if (typeof middleware === "string") {
      this.middlewares = this.middlewares.filter(m => (m as any).id !== middleware);
    } else {
      this.middlewares = this.middlewares.filter(m => m !== middleware);
    }
    return this;
  }

  onInfo(callback: (info: T_INFO) => void): () => void {
    return this.adapter.onInfo ? this.adapter.onInfo(callback) : (() => {});
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

  emitTelemetry(telemetry: EngineTelemetry): void {
    this.adapter.emitTelemetry(telemetry);
  }

  private createContext(options: T_OPTIONS): MiddlewareContext<T_OPTIONS> {
    return {
      engineId: this.id,
      options,
    };
  }
}
