import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  IEngineError,
  EngineTelemetry,
  EngineErrorCode,
  EngineError,
  IMiddleware,
  I18nKey,
  IBookAsset,
  ProgressCallback, createI18nKey } from "@multi-game-engines/core";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * アンサンブル合議戦略のインターフェース。
 */
export interface IEnsembleStrategy<
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  /** 戦略の識別子 */
  readonly id: string;
  /**
   * 複数のエンジンからの結果を統合して一つにします。
   * @param results - エンジン ID をキー、検索結果を値とする Map。
   */
  aggregateResults(results: Map<string, T_RESULT>): T_RESULT;
  /**
   * 複数のエンジンからの途中経過を統合します（オプション）。
   */
  aggregateInfo?(infos: Map<string, T_INFO[]>): T_INFO | undefined;
}

/**
 * 2026 Zenith Tier: アンサンブル・アダプター。
 * 複数のゲームエンジンを束ね、合議制（Swarm式）で最善手を決定します。
 */
export class EnsembleAdapter<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT> {
  public status: EngineStatus = "uninitialized";
  public lastError: IEngineError | null = null;

  private engines: IEngine<T_OPTIONS, T_INFO, T_RESULT>[] = [];
  private strategy: IEnsembleStrategy<T_INFO, T_RESULT>;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string,
    engines: IEngine<T_OPTIONS, T_INFO, T_RESULT>[],
    strategy: IEnsembleStrategy<T_INFO, T_RESULT>,
  ) {
    this.engines = engines;
    this.strategy = strategy;
  }

  async load(): Promise<void> {
    this.status = "loading";
    try {
      await Promise.all(this.engines.map((e) => e.load()));
      this.status = "ready";
    } catch (error) {
      this.status = "error";
      const engineError = EngineError.from(error, this.id);
      this.lastError = engineError;
      throw engineError;
    }
  }

  consent(): void {
    this.engines.forEach((e) => {
      if (typeof e.consent === "function") e.consent();
    });
  }

  async setBook(
    asset: IBookAsset,
    options?: { signal?: AbortSignal; onProgress?: ProgressCallback },
  ): Promise<void> {
    await Promise.all(this.engines.map((e) => e.setBook(asset, options)));
  }

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    if (this.status !== "ready") {
      const i18nKey = createI18nKey("engine.errors.notReady");
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: translate(i18nKey),
        i18nKey,
        engineId: this.id,
      });
    }

    this.status = "busy";
    try {
      // 全てのサブエンジンで並列探索
      const resultMap = new Map<string, T_RESULT>();
      await Promise.all(
        this.engines.map(async (e) => {
          const res = await e.search(options);
          resultMap.set(e.id, res);
        }),
      );
      const aggregated = this.strategy.aggregateResults(resultMap);
      this.status = "ready";
      return aggregated;
    } catch (error) {
      this.status = "error";
      const engineError = EngineError.from(error, this.id);
      this.lastError = engineError;
      throw engineError;
    }
  }

  stop(): void {
    this.engines.forEach((e) => e.stop());
    this.status = "ready";
  }

  async dispose(): Promise<void> {
    await Promise.all(this.engines.map((e) => e.dispose()));
    this.status = "disposed";
  }

  onInfo(callback: (info: T_INFO) => void): () => void {
    const unsubs = this.engines.map((e) => e.onInfo(callback));
    return () => unsubs.forEach((u) => u());
  }

  onSearchResult(callback: (result: T_RESULT) => void): () => void {
    const unsubs = this.engines.map((e) => e.onSearchResult(callback));
    return () => unsubs.forEach((u) => u());
  }

  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    const unsubs = this.engines.map((e) =>
      e.onStatusChange(() => {
        // いずれかのエンジンが status 変更されたら。
        // アンサンブルとしての統合ステータスを計算して通知
        const statuses = this.engines.map((eng) => eng.status);
        if (statuses.some((s) => s === "error")) {
          this.status = "error";
        } else if (statuses.some((s) => s === "busy")) {
          this.status = "busy";
        } else if (statuses.every((s) => s === "ready")) {
          this.status = "ready";
        }
        callback(this.status);
      }),
    );
    return () => unsubs.forEach((u) => u());
  }

  onTelemetry(callback: (telemetry: EngineTelemetry) => void): () => void {
    const unsubs = this.engines.map((e) => e.onTelemetry(callback));
    return () => unsubs.forEach((u) => u());
  }

  emitTelemetry(_telemetry: EngineTelemetry): void {
    // NOP
  }

  use(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>): this {
    this.engines.forEach((e) => e.use(middleware));
    return this;
  }

  unuse(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT> | string): this {
    this.engines.forEach((e) => e.unuse(middleware));
    return this;
  }
}
