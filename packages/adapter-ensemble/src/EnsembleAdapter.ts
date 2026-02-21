import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  IEngineError,
  EngineTelemetry,
  EngineErrorCode,
  IMiddleware,
} from "@multi-game-engines/core";

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
   */
  aggregateResults(results: T_RESULT[]): T_RESULT;
  /**
   * 複数のエンジンからの途中経過を統合します（オプション）。
   */
  aggregateInfo?(infos: T_INFO[]): T_INFO | undefined;
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
      if (error instanceof Error) {
        this.lastError = {
          code: EngineErrorCode.INTERNAL_ERROR,
          message: error.message,
          engineId: this.id,
        };
      }
      throw error;
    }
  }

  async search(options: T_OPTIONS): Promise<T_RESULT> {
    if (this.status !== "ready") {
      throw new Error(
        `Ensemble engine ${this.id} is not ready (status: ${this.status})`,
      );
    }

    this.status = "busy";
    try {
      // 全てのサブエンジンで並列探索
      const results = await Promise.all(
        this.engines.map((e) => e.search(options)),
      );
      const aggregated = this.strategy.aggregateResults(results);
      this.status = "ready";
      return aggregated;
    } catch (error) {
      this.status = "error";
      throw error;
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
