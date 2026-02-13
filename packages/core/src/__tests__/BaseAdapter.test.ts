import { describe, it, expect, vi } from "vitest";
import { BaseAdapter } from "../adapters/BaseAdapter.js";
import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IProtocolParser,
  EngineStatus,
} from "../types.js";

// モック用の型定義
class TestAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  id = "test-adapter";
  name = "Test Adapter";
  version = "1.0.0";
  parser = {
    createSearchCommand: vi.fn(),
    createStopCommand: vi.fn(),
    createOptionCommand: vi.fn(),
    parseInfo: vi.fn(),
    parseResult: vi.fn(),
  } as unknown as IProtocolParser<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;

  async load() {}
  async dispose() {}

  // テスト用の公開ラッパー
  public testEmitStatusChange(status: EngineStatus) {
    this.emitStatusChange(status);
  }
}

describe("BaseAdapter", () => {
  it("should initialize with uninitialized status", () => {
    const adapter = new TestAdapter();
    expect(adapter.status).toBe("uninitialized");
  });

  it("should notify status changes to listeners", () => {
    const adapter = new TestAdapter();
    const statusSpy = vi.fn();
    adapter.onStatusChange(statusSpy);

    adapter.testEmitStatusChange("ready");

    expect(statusSpy).toHaveBeenCalledWith("ready");
    expect(adapter.status).toBe("ready");
  });

  it("should unsubscribe listeners", () => {
    const adapter = new TestAdapter();
    const statusSpy = vi.fn();
    const unsubscribe = adapter.onStatusChange(statusSpy);

    unsubscribe();
    adapter.testEmitStatusChange("busy");

    expect(statusSpy).not.toHaveBeenCalled();
  });
});
