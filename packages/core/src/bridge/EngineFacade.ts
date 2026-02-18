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
} from "../types.js";
import { EngineError } from "../errors/EngineError.js";

/**
 * エンジンとの対話を抽象化し、共通機能を提供するファサードクラス。
 */
export class EngineFacade<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT> {
  private middlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [];
  private _lastError: EngineError | null = null;
  private activeTaskStop: (() => void) | null = null;
  private loadPromise: Promise<void> | null = null;
  public loadingStrategy: EngineLoadingStrategy = "on-demand";

  private statusListeners = new Set<(status: EngineStatus) => void>();
  private infoListeners = new Set<(info: T_INFO) => void>();
  private telemetryListeners = new Set<(telemetry: EngineTelemetry) => void>();
  private resultListeners = new Set<(result: T_RESULT) => void>();
  private adapterUnsubscribers: (() => void)[] = [];

  constructor(
    private adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    initialMiddlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [],
    private loaderProvider?: () => Promise<IEngineLoader>,
    private ownAdapter: boolean = true,
  ) {
    this.middlewares = [...initialMiddlewares];
    this.setupAdapterListeners();
  }

  private setupAdapterListeners(): void {
    const context: MiddlewareContext<T_OPTIONS> = { engineId: this.id };

    this.adapterUnsubscribers.push(
      this.adapter.onStatusChange((status) => {
        for (const cb of this.statusListeners) cb(status);
      }),
    );

    this.adapterUnsubscribers.push(
      this.adapter.onInfo?.(async (rawInfo) => {
        let info: T_INFO = rawInfo;
        for (const mw of this.middlewares) {
          if (mw.onInfo) {
            const processed = await mw.onInfo(info, context);
            if (this.isValidInfo(processed)) {
              info = processed;
            }
          }
        }
        for (const cb of this.infoListeners) cb(info);
      }) || (() => {}),
    );

    this.adapterUnsubscribers.push(
      this.adapter.onSearchResult((result) => {
        for (const cb of this.resultListeners) cb(result);
      }),
    );

    this.adapterUnsubscribers.push(
      this.adapter.onTelemetry((telemetry) => {
        for (const cb of this.telemetryListeners) cb(telemetry);
      }),
    );
  }

  get id() {
    return this.adapter.id;
  }
  get name() {
    return this.adapter.name;
  }
  get version() {
    return this.adapter.version;
  }
  get status() {
    return this.adapter.status;
  }
  get lastError() {
    return this._lastError;
  }

  use(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>): this {
    if (middleware.id) {
      // 2026 Best Practice: ID が指定されている場合は重複を排除（既存のものを削除して置換）
      this.middlewares = this.middlewares.filter((m) => m.id !== middleware.id);
    }
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return this;
  }

  unuse(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT> | string): this {
    if (typeof middleware === "string") {
      this.middlewares = this.middlewares.filter((m) => m.id !== middleware);
    } else {
      this.middlewares = this.middlewares.filter((m) => m !== middleware);
    }
    return this;
  }

  async load(): Promise<void> {
    if (this.status !== "uninitialized") return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        // 2026 Best Practice: ロード前に能力要件を検証
        await this.enforceCapabilities();

        if (this.adapter.load) {
          const loader = this.loaderProvider
            ? await this.loaderProvider()
            : undefined;
          await this.adapter.load(loader);
        }
      } catch (err: unknown) {
        this._lastError = EngineError.from(err, this.id);
        throw this._lastError;
      } finally {
        this.loadPromise = null;
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

    if (this.activeTaskStop) {
      this.activeTaskStop();
    }

    const context: MiddlewareContext<T_OPTIONS> = {
      engineId: this.id,
      options,
      emitTelemetry: (t) => this.emitTelemetry(t),
    };

    try {
      let command = this.adapter.parser.createSearchCommand(options);
      for (const mw of this.middlewares) {
        if (mw.onCommand) {
          const next = await mw.onCommand(command, context);
          if (next !== undefined && next !== null) command = next;
        }
      }

      const task = this.adapter.searchRaw(command);
      this.activeTaskStop =
        typeof task.stop === "function" ? () => task.stop() : null;

      const result = await task.result;

      let processedResult = result;
      for (const mw of this.middlewares) {
        if (mw.onResult) {
          const next = await mw.onResult(processedResult, context);
          if (this.isValidResult(next)) processedResult = next;
        }
      }

      return processedResult;
    } catch (err: unknown) {
      this._lastError = EngineError.from(err, this.id);
      throw this._lastError;
    } finally {
      this.activeTaskStop = null;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.adapter.stop();
    } catch (err: unknown) {
      console.error(`[EngineFacade] Failed to stop engine ${this.id}:`, err);
      // エラーはログに記録し、例外自体は投げない（ステートレスな停止を優先）
    }
  }

  async dispose(): Promise<void> {
    for (const unsub of this.adapterUnsubscribers) {
      unsub();
    }
    this.adapterUnsubscribers = [];
    this.statusListeners.clear();
    this.infoListeners.clear();
    this.resultListeners.clear();
    this.telemetryListeners.clear();

    if (this.ownAdapter && this.adapter.dispose) {
      await this.adapter.dispose();
    }
  }

  onStatusChange(callback: (status: EngineStatus) => void) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onInfo(callback: (info: T_INFO) => void) {
    this.infoListeners.add(callback);
    return () => this.infoListeners.delete(callback);
  }

  onSearchResult(callback: (result: T_RESULT) => void) {
    this.resultListeners.add(callback);
    return () => this.resultListeners.delete(callback);
  }

  onTelemetry(callback: (telemetry: EngineTelemetry) => void) {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  emitTelemetry(telemetry: EngineTelemetry): void {
    this.adapter.emitTelemetry(telemetry);
  }

  private async enforceCapabilities(): Promise<void> {
    if (!this.adapter.requiredCapabilities) return;

    const { CapabilityDetector } =
      await import("../capabilities/CapabilityDetector.js");
    const caps = await CapabilityDetector.detect();
    const missing: string[] = [];

    for (const [key, required] of Object.entries(
      this.adapter.requiredCapabilities,
    )) {
      if (required && !caps[key as keyof ICapabilities]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `Environment does not support required capabilities: ${missing.join(", ")}`,
        engineId: this.id,
        remediation:
          "Ensure the site is served over HTTPS and Cross-Origin Isolation headers (COOP/COEP) are enabled if Threads/SharedArrayBuffer are required.",
      });
    }
  }

  private isValidInfo(info: unknown): info is T_INFO {
    // 2026: info はエンジン固有だが、少なくともオブジェクトであるか
    // ミドルウェアが明示的に null/undefined を返さないことを確認
    return info !== undefined && info !== null;
  }

  private isValidResult(res: unknown): res is T_RESULT {
    return (
      typeof res === "object" &&
      res !== null &&
      ("bestMove" in res || "ponder" in res)
    );
  }
}
