import {
  IEngine,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  IBaseSearchOptions,
  IBaseSearchResult,
} from "@multi-game-engines/core";
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

  private infoListeners: Set<(info: ExtendedSearchInfo) => void> = new Set();
  private statusListeners: Set<(status: EngineStatus) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: MockEngineOptions = { latency: 0 }) {}

  async load(): Promise<void> {
    this.updateStatus("loading");
    await new Promise((r) => setTimeout(r, 500));
    this.updateStatus("ready");
  }

  async search(_options: IBaseSearchOptions): Promise<IBaseSearchResult> {
    if (this.options.failOnSearch) {
      this.updateStatus("error");
      throw new Error("Simulated search failure");
    }

    this.updateStatus("busy");
    let depth = 0;

    this.intervalId = setInterval(
      () => {
        depth++;
        const info: ExtendedSearchInfo = {
          depth,
          nodes: depth * 1000 + Math.floor(Math.random() * 100),
          nps: 50000 + Math.floor(Math.random() * 5000),
          time: depth * 100,
          multipv: 1,
          score: { cp: depth * 5 },
          pv: ["e2e4", "e7e5", "g1f3", "b8c6"].slice(0, (depth % 4) + 1),
        };

        this.infoListeners.forEach((l) => l(info));
        if (depth >= 100) void this.stop();
      },
      100 + (this.options.latency || 0),
    );

    return { raw: "bestmove e2e4" };
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.updateStatus("ready");
  }

  onInfo(callback: (info: ExtendedSearchInfo) => void): () => void {
    this.infoListeners.add(callback);
    return () => this.infoListeners.delete(callback);
  }

  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onProgress(_callback: (progress: ILoadProgress) => void): () => void {
    return () => {};
  }
  onTelemetry(_callback: (event: ITelemetryEvent) => void): () => void {
    return () => {};
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
