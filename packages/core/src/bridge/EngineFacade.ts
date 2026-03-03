import { createI18nKey } from "../protocol/ProtocolValidator.js";
import {
  IEngine,
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  IMiddleware,
  MiddlewareContext,
  EngineErrorCode,
  EngineTelemetry,
  EngineLoadingStrategy,
  IEngineLoader,
  ICapabilities,
  IBaseSearchInfo,
  PositionId,
  IEngineConfig,
} from "../types.js";
import { EngineError } from "../errors/EngineError.js";
import { ResourceGovernor } from "../capabilities/ResourceGovernor.js";

/**
 * @internal
 * 内部アダプターへのアクセス用 Symbol。
 */
export const INTERNAL_ADAPTER = Symbol("INTERNAL_ADAPTER");

// 2026: 非同期制御用ヘルパー
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * エンジンとの対話を抽象化し、共通機能を提供するファサードクラス。
 * 2026 Zenith Tier: Stale Message Filtering, Background Throttling, Resource Optimization 対応。
 */
export class EngineFacade<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT> {
  private middlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [];
  private _lastError: EngineError | null = null;
  private activeTaskStop: (() => void) | null = null;
  private loadPromise: Promise<void> | null = null;
  private loadAbortController: AbortController | null = null;
  private currentPositionId: PositionId | null = null;
  private consentDeferred: {
    promise: Promise<void>;
    resolve: () => void;
  } | null = null;
  public loadingStrategy: EngineLoadingStrategy = "on-demand";

  private statusListeners = new Set<(status: EngineStatus) => void>();
  private infoListeners = new Set<(info: T_INFO) => void>();
  private telemetryListeners = new Set<(telemetry: EngineTelemetry) => void>();
  private resultListeners = new Set<(result: T_RESULT) => void>();

  private adapterUnsubscribers: (() => void)[] = [];

  constructor(
    private readonly adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    middlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [],
    private readonly loaderProvider?: () => Promise<IEngineLoader>,
  ) {
    this.middlewares = [...middlewares];

    // アダプターからのイベントを購読
    this.adapterUnsubscribers.push(
      this.adapter.onStatusChange((status) => {
        this.emitStatusChange(status);
      }),
    );

    this.adapterUnsubscribers.push(
      this.adapter.onTelemetry((t) => {
        let processed = t;
        for (const mw of this.middlewares) {
          if (mw.onTelemetry) {
            try {
              processed = mw.onTelemetry(processed) || processed;
            } catch (err) {
              console.error(
                `[EngineFacade] Middleware "${mw.id || "unknown"}" failed in onTelemetry:`,
                err,
              );
            }
          }
        }
        this.emitTelemetry(processed);
      }),
    );

    this.adapterUnsubscribers.push(
      this.adapter.onInfo?.(async (rawInfo) => {
        if (
          this.currentPositionId &&
          (rawInfo as unknown).positionId &&
          (rawInfo as unknown).positionId !== this.currentPositionId
        ) {
          return;
        }

        let processed = rawInfo;
        for (const mw of this.middlewares) {
          if (mw.onInfo) {
            try {
              processed = (await mw.onInfo(processed)) || processed;
            } catch (err) {
              console.error(
                `[EngineFacade] Middleware "${mw.id || "unknown"}" failed in onInfo:`,
                err,
              );
            }
          }
        }
        for (const listener of this.infoListeners) {
          listener(processed);
        }
      }),
    );

    this.adapterUnsubscribers.push(
      this.adapter.onSearchResult?.(async (rawResult) => {
        let processed = rawResult;
        for (const mw of this.middlewares) {
          if (mw.onResult) {
            try {
              processed = (await mw.onResult(processed)) || processed;
            } catch (err) {
              console.error(
                `[EngineFacade] Middleware "${mw.id || "unknown"}" failed in onResult:`,
                err,
              );
            }
          }
        }
        for (const listener of this.resultListeners) {
          listener(processed);
        }
      }),
    );

    if (typeof document !== "undefined") {
      const handleVisibilityChange = () => {
        const isHidden = document.visibilityState === "hidden";
        this.emitTelemetry({
          type: "performance",
          timestamp: Date.now(),
          metadata: { visibility: document.visibilityState },
        });
        if (isHidden) {
          ResourceGovernor.onBackgroundThrottling();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      this.adapterUnsubscribers.push(() =>
        document.removeEventListener("visibilitychange", handleVisibilityChange),
      );
    }
  }

  get id() { return this.adapter.id; }
  get status() { return this.adapter.status; }
  get lastError() { return this._lastError; }
  get config(): IEngineConfig {
    return (this.adapter as unknown).config || {};
  }

  consent(): void {
    if (this.consentDeferred) {
      this.consentDeferred.resolve();
      this.consentDeferred = null;
    }
  }

  async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadAbortController = new AbortController();
    const signal = this.loadAbortController.signal;

    this.loadPromise = (async () => {
      const id = this.adapter.id;
      try {
        if (this.loadingStrategy === "consent") {
          const { promise, resolve } = createDeferred<void>();
          this.consentDeferred = { promise, resolve };
          this.emitStatusChange("ready");
          
          await Promise.race([
            promise,
            new Promise((_, reject) => {
              signal.addEventListener("abort", () => reject(new EngineError({
                code: EngineErrorCode.CANCELLED,
                message: "Load aborted by disposal",
                engineId: id
              })));
            })
          ]);
          this.consentDeferred = null;
        }

        // 2026: loaderProvider がない場合は、アダプターの直接ロードを試行（後方互換性）
        if (this.loaderProvider) {
          const loader = await this.loaderProvider();
          if (signal.aborted) throw new Error("Aborted");

          const sources = this.config.sources || {};
          const resources: Record<string, string> = {};
          
          for (const [key, source] of Object.entries(sources)) {
            resources[key] = await loader.loadResource(id, source as IEngineSourceConfig, { signal });
          }

          await this.adapter.load(resources);
        } else {
          await this.adapter.load();
        }
        
        this.emitStatusChange("ready");
      } catch (err) {
        this.loadPromise = null;
        this.loadAbortController = null;
        if (signal.aborted || (err as unknown).code === EngineErrorCode.CANCELLED) {
          throw new EngineError({
            code: EngineErrorCode.CANCELLED,
            message: "Engine loading was cancelled.",
            engineId: id,
            i18nKey: createI18nKey("engine.errors.searchAborted"),
          });
        }
        throw err;
      }
    })();

    return this.loadPromise;
  }

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    if (
      this.status === "uninitialized" &&
      this.loadingStrategy === "on-demand"
    ) {
      await this.load();
    }

    if (this.adapter.status === "busy") {
      this.activeTaskStop?.();
    }

    const context: MiddlewareContext<T_OPTIONS> = {
      engineId: this.id,
      options,
      emitTelemetry: (t) => this.emitTelemetry(t),
    };

    try {
      this.currentPositionId = options.positionId || null;
      let command = this.adapter.parser.createSearchCommand(options);

      for (const mw of this.middlewares) {
        if (mw.onCommand) {
          try {
            const result = await mw.onCommand(command, context);
            if (result) command = result;
          } catch (err) {
            console.error(
              `[EngineFacade] Middleware "${mw.id || "unknown"}" failed in onCommand:`,
              err,
            );
          }
        }
      }

      const task = this.adapter.searchRaw(command);
      this.activeTaskStop =
        typeof task.stop === "function" ? () => task.stop() : null;

      const result = await task.result;

      if (options.positionId && this.currentPositionId !== options.positionId) {
        const i18nKey = createI18nKey("engine.errors.stalePositionId");
        throw new EngineError({
          code: EngineErrorCode.CANCELLED,
          message: "Search result discarded (Stale PositionId)",
          engineId: this.id,
          i18nKey,
        });
      }

      let processedResult = result;
      for (const mw of this.middlewares) {
        if (mw.onResult) {
          try {
            processedResult =
              (await mw.onResult(processedResult)) || processedResult;
          } catch (err) {
            console.error(
              `[EngineFacade] Middleware "${mw.id || "unknown"}" failed in onResult:`,
              err,
            );
          }
        }
      }

      return processedResult;
    } catch (err) {
      this._lastError = EngineError.from(err, EngineErrorCode.INTERNAL_ERROR);
      this._lastError.engineId = this.id;
      throw this._lastError;
    } finally {
      this.activeTaskStop = null;
    }
  }

  stop(): void {
    this.activeTaskStop?.();
  }

  async setOption(
    name: string,
    value: string | number | boolean,
  ): Promise<void> {
    await this.adapter.setOption(name, value);
  }

  async dispose(): Promise<void> {
    const id = this.adapter.id;
    const isAlreadyDisposed =
      this.adapter.status === "disposed" ||
      this.adapter.status === "terminated";

    for (const unsub of this.adapterUnsubscribers) {
      unsub();
    }
    this.adapterUnsubscribers = [];
    
    this.statusListeners.clear();
    this.infoListeners.clear();
    this.resultListeners.clear();
    this.telemetryListeners.clear();

    if (this.activeTaskStop) {
      try {
        await Promise.resolve(this.activeTaskStop());
      } catch (err) {
        console.error(
          `[EngineFacade] Failed to stop active task for engine ${id}:`,
          err,
        );
      }
    }
    this.activeTaskStop = null;

    if (this.loadAbortController) {
      this.loadAbortController.abort();
    }

    if (this.consentDeferred) {
      this.consentDeferred.resolve();
      this.consentDeferred = null;
    }

    if (!isAlreadyDisposed) {
      try {
        await this.adapter.dispose();
      } catch (err) {
        console.error(`[EngineFacade] Error during adapter disposal (${id}):`, err);
      }
    }
  }

  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onInfo(callback: (info: T_INFO) => void): () => void {
    this.infoListeners.add(callback);
    return () => this.infoListeners.delete(callback);
  }

  onSearchResult(callback: (result: T_RESULT) => void): () => void {
    this.resultListeners.add(callback);
    return () => this.resultListeners.delete(callback);
  }

  onTelemetry(callback: (telemetry: EngineTelemetry) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  private emitStatusChange(status: EngineStatus): void {
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private emitTelemetry(telemetry: EngineTelemetry): void {
    for (const listener of this.telemetryListeners) {
      listener(telemetry);
    }
  }

  /** @internal */
  [INTERNAL_ADAPTER]() {
    return this.adapter;
  }
}
