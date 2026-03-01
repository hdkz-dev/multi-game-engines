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
  I18nKey,
  IBaseSearchInfo,
  PositionId,
  IEngineConfig,
  IBookAsset,
  ProgressCallback,
} from "../types.js";
import { EngineError } from "../errors/EngineError.js";
import { ResourceGovernor } from "../capabilities/ResourceGovernor.js";

/**
 * @internal
 * 内部アダプターへのアクセス用 Symbol。
 */
export const INTERNAL_ADAPTER = Symbol("INTERNAL_ADAPTER");

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
    private adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    initialMiddlewares: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>[] = [],
    private loaderProvider?: () => Promise<IEngineLoader>,
    private ownAdapter: boolean = true,
  ) {
    this.middlewares = [...initialMiddlewares];
    this.setupAdapterListeners();
    this.setupVisibilityListener();
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
        // 2026: Stale Message Filtering (PositionId チェック)
        if (
          this.currentPositionId &&
          rawInfo.positionId &&
          rawInfo.positionId !== this.currentPositionId
        ) {
          return; // 古い局面の情報は破棄
        }

        let info: T_INFO = rawInfo;
        for (const mw of this.middlewares) {
          if (mw.onInfo) {
            try {
              const processed = await mw.onInfo(info, context);
              if (this.isValidInfo(processed)) {
                info = processed;
              }
            } catch (err) {
              console.error(
                `[EngineFacade] Middleware "${mw.id || "unknown"}" failed in onInfo:`,
                err,
              );
              // 2026: 故障したミドルウェアをスキップし、元の情報を維持
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

  /**
   * 2026 Zenith: タブ非表示時のリソース節約 (Background Throttling)
   */
  private setupVisibilityListener(): void {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.hidden && this.status === "busy") {
        // バックグラウンド時は思考を一時停止するかスローダウン
        // ここでは安全のため停止を推奨 (または LowPowerMode への動的切替)
        void this.stop();
        this.emitTelemetry({
          type: "lifecycle",
          timestamp: Date.now(),
          metadata: { action: "background_throttle", reason: "tab_hidden" },
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    this.adapterUnsubscribers.push(() =>
      document.removeEventListener("visibilitychange", handleVisibilityChange),
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
  get config() {
    return (this.adapter as unknown as { config: IEngineConfig }).config;
  }

  consent(): void {
    if (this.consentDeferred) {
      this.consentDeferred.resolve();
      this.consentDeferred = null;
    }
  }

  async setBook(
    asset: IBookAsset,
    options?: { signal?: AbortSignal; onProgress?: ProgressCallback },
  ): Promise<void> {
    await this.adapter.setBook(asset, options);
  }

  use(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>): this {
    if (middleware.id) {
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
      const targetId = middleware.id;
      this.middlewares = this.middlewares.filter(
        (m) => m !== middleware && (!targetId || m.id !== targetId),
      );
    }
    return this;
  }

  async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    if (this.status !== "uninitialized") return;

    this.loadPromise = (async () => {
      try {
        // 2026: Consent Handshake
        if (this.config?.disclaimer || this.config?.licenseUrl) {
          // 内部的なステータス変更手段がないため、アダプター経由またはイベント経由で通知
          // 簡易的に deferred promise で待機
          let resolveConsent: () => void = () => {};
          const promise = new Promise<void>((r) => {
            resolveConsent = r;
          });
          this.consentDeferred = { promise, resolve: resolveConsent };

          // ステータス変更の通知（アダプターがサポートしている必要があるが、
          // Facade レベルでの状態管理を強化）
          (this.adapter as unknown as { _status: EngineStatus })._status =
            "awaiting-consent";
          for (const cb of this.statusListeners) cb("awaiting-consent");

          await promise;
        }

        await this.enforceCapabilities();

        if (this.adapter.load) {
          const loader = this.loaderProvider
            ? await this.loaderProvider()
            : undefined;
          await this.adapter.load(loader);
        }

        // 2026 Zenith: ロード直後に環境に最適なオプションを自動設定
        const recommended = await ResourceGovernor.getRecommendedOptions();
        for (const [key, val] of Object.entries(recommended)) {
          if (
            typeof val === "string" ||
            typeof val === "number" ||
            typeof val === "boolean"
          ) {
            await this.adapter.setOption(key, val);
          }
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
    // 2026: PositionId を即座に更新し、ロード待ちの間もメッセージをフィルタリングできるようにする
    this.currentPositionId = options.positionId || null;

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
          try {
            const next = await mw.onCommand(command, context);
            if (next !== undefined && next !== null) command = next;
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

      // 古いリクエストの結果であれば破棄
      if (options.positionId && this.currentPositionId !== options.positionId) {
        throw new EngineError({
          code: EngineErrorCode.CANCELLED,
          message: "Search result discarded (Stale PositionId)",
          engineId: this.id,
        });
      }

      let processedResult = result;
      for (const mw of this.middlewares) {
        if (mw.onResult) {
          try {
            const next = await mw.onResult(processedResult, context);
            if (this.isValidResult(next)) processedResult = next;
          } catch (err) {
            console.error(
              `[EngineFacade] Middleware "${mw.id || "unknown"}" failed in onResult:`,
              err,
            );
          }
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

    // 2026: Cleanup consent promise
    if (this.consentDeferred) {
      this.consentDeferred.resolve(); // Resolve to let load finish/fail safely
      this.consentDeferred = null;
    }

    if (this.ownAdapter) {
      const id = this.id;
      try {
        // 2026: Graceful Shutdown (quit 送信)
        await this.adapter.stop();
        await this.adapter.dispose();
      } catch (err) {
        console.error(`[EngineFacade] Failed to dispose adapter ${id}:`, err);
      }

      if (this.loaderProvider) {
        try {
          const loader = await this.loaderProvider();
          loader.revokeByEngineId(id);
        } catch {
          // Ignore
        }
      }
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

  [INTERNAL_ADAPTER](): IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT> {
    return this.adapter;
  }

  emitTelemetry(telemetry: EngineTelemetry): void {
    this.adapter.emitTelemetry(telemetry);
  }

  private async enforceCapabilities(): Promise<void> {
    if (!this.adapter.requiredCapabilities) return;

    const { EnvironmentDetector } =
      await import("../capabilities/EnvironmentDetector.js");
    const caps = await EnvironmentDetector.detect();
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
        message: `Required capabilities missing: ${missing.join(", ")}`,
        engineId: this.id,
        i18nKey: createI18nKey("engine.errors.securityViolation"),
        remediation:
          "Ensure HTTPS and COOP/COEP are enabled if Threads/SharedArrayBuffer are required.",
      });
    }
  }

  private isValidInfo(info: unknown): info is T_INFO {
    return typeof info === "object" && info !== null && !Array.isArray(info);
  }

  private isValidResult(res: unknown): res is T_RESULT {
    return (
      typeof res === "object" &&
      res !== null &&
      ("bestMove" in res || "ponder" in res)
    );
  }
}
