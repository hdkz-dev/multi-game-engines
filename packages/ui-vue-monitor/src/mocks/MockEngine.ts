import { IEngine, EngineStatus, ILoadProgress, ITelemetryEvent, IBaseSearchOptions, IBaseSearchResult, IMiddleware, EngineErrorCode, EngineError, createMove, IBookAsset } from "@multi-game-engines/core";
import { ExtendedSearchInfo } from "@multi-game-engines/ui-core";

export interface MockEngineOptions {
  latency?: number;
  failOnSearch?: boolean;
}

/**
 * プロフェッショナルなテストを可能にする高度なモックエンジン。
 */
export class MockEngine implements IEngine<
  IBaseSearchOptions,
  ExtendedSearchInfo,
  IBaseSearchResult
> {
  id = "mock-engine";
  name = "Mock Engine 2026";
  version = "1.0.0";
  status: EngineStatus = "ready";
  loadingStrategy: "manual" | "on-demand" | "eager" = "eager";
  lastError: EngineError | null = null;

  private infoListeners: Set<(info: ExtendedSearchInfo) => void> = new Set();
  private statusListeners: Set<(status: EngineStatus) => void> = new Set();
  private telemetryListeners: Set<(event: ITelemetryEvent) => void> = new Set();
  private resultListeners: Set<(result: IBaseSearchResult) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: MockEngineOptions = { latency: 0 }) {}

  async load(): Promise<void> {
    this.updateStatus("loading");
    await new Promise((r) => setTimeout(r, 500));
    this.updateStatus("ready");
  }

  consent(): void {
    // NOP
  }

  async setBook(_asset: IBookAsset): Promise<void> {
    // NOP
  }

  async search(_options: IBaseSearchOptions): Promise<IBaseSearchResult> {
    if (this.options.failOnSearch) {
      this.lastError = new EngineError({
        message: "Simulated failure",
        code: EngineErrorCode.INTERNAL_ERROR,
        remediation: "Check mock settings.",
        engineId: this.id,
      });
      this.updateStatus("error");
      throw this.lastError;
    }

    await this.stop();
    this.updateStatus("busy");
    let depth = 0;

    this.intervalId = setInterval(
      () => {
        depth++;
        const info: ExtendedSearchInfo = {
          depth,
          nodes: depth * 1000 + (depth % 100),
          nps: 50000 + (depth % 5000),
          time: depth * 100,
          multipv: 1,
          score: { cp: depth * 5 },
          pv: ["e2e4", "e7e5", "g1f3", "b8c6"].map(createMove),
        };

        this.infoListeners.forEach((l) => l(info));
        if (depth >= 10) {
          const result: IBaseSearchResult = { bestMove: createMove("e2e4") };
          this.resultListeners.forEach((l) => l(result));
          void this.stop().catch((e) => console.error(e));
        }
      },
      100 + (this.options.latency || 0),
    );

    return { bestMove: createMove("e2e4") };
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.updateStatus("ready");
    }
  }

  use(
    _middleware: IMiddleware<
      IBaseSearchOptions,
      ExtendedSearchInfo,
      IBaseSearchResult
    >,
  ): this {
    return this;
  }

  unuse(
    _middleware:
      | IMiddleware<IBaseSearchOptions, ExtendedSearchInfo, IBaseSearchResult>
      | string,
  ): this {
    return this;
  }

  onInfo(callback: (info: ExtendedSearchInfo) => void): () => void {
    this.infoListeners.add(callback);
    return () => this.infoListeners.delete(callback);
  }

  onSearchResult(callback: (result: IBaseSearchResult) => void): () => void {
    this.resultListeners.add(callback);
    return () => this.resultListeners.delete(callback);
  }

  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onProgress(_callback: (progress: ILoadProgress) => void): () => void {
    return () => {};
  }

  onTelemetry(callback: (event: ITelemetryEvent) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  emitTelemetry(event: ITelemetryEvent): void {
    this.telemetryListeners.forEach((l) => l(event));
  }

  async setOption(
    _name: string,
    _value: string | number | boolean,
  ): Promise<void> {}
  async dispose(): Promise<void> {
    await this.stop();
  }

  private updateStatus(status: EngineStatus) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }
}
