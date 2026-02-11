import { describe, it, expect, vi } from "vitest";
import { BaseAdapter } from "../adapters/BaseAdapter";
import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ISearchTask,
  IProtocolParser,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
} from "../types";

// モック用の型定義
class TestAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  readonly id = "test";
  readonly name = "Test";
  readonly version = "1.0";
  readonly parser = {} as IProtocolParser<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;

  async load(): Promise<void> {
    this.emitStatusChange("ready");
  }

  searchRaw(): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    return {} as ISearchTask<IBaseSearchInfo, IBaseSearchResult>;
  }

  async dispose(): Promise<void> {
    this.emitStatusChange("terminated");
  }

  // 内部メソッドの公開
  public testStatus(status: EngineStatus) {
    this.emitStatusChange(status);
  }

  public testProgress(progress: ILoadProgress) {
    this.emitProgress(progress);
  }

  public testTelemetry(event: ITelemetryEvent) {
    this.emitTelemetry(event);
  }
}

describe("BaseAdapter", () => {
  it("should handle status changes correctly", () => {
    const adapter = new TestAdapter();
    const spy = vi.fn();
    adapter.onStatusChange(spy);

    adapter.testStatus("busy");
    expect(adapter.status).toBe("busy");
    expect(spy).toHaveBeenCalledWith("busy");
  });

  it("should handle progress updates", () => {
    const adapter = new TestAdapter();
    const spy = vi.fn();
    adapter.onProgress(spy);

    const progress: ILoadProgress = { phase: "downloading", percentage: 50 };
    adapter.testProgress(progress);
    expect(spy).toHaveBeenCalledWith(progress);
  });
});
