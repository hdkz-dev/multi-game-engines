import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EngineStore } from "../store.js";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";

describe("EngineStore", () => {
  const mockEngine = { status: "ready" } as unknown as IEngine<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;
  let mockTimestamp = 0;

  beforeEach(() => {
    mockTimestamp = 0;
    vi.useFakeTimers();

    // performance.now() の決定論的モック
    vi.stubGlobal("performance", {
      now: () => mockTimestamp,
    });

    // requestAnimationFrame の決定論的モック
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      return setTimeout(() => {
        mockTimestamp += 16;
        cb(mockTimestamp);
      }, 16);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("should initialize with initial state", () => {
    const store = new EngineStore(mockEngine, { count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it("should notify listeners after state change (RAF sync by default)", async () => {
    const store = new EngineStore(mockEngine, { count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(0);

    store.setState((s) => ({ count: s.count + 1 }));
    expect(listener).toHaveBeenCalledTimes(0);

    // RAFを1フレーム分進める
    vi.advanceTimersByTime(16);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState()).toEqual({ count: 1 });
  });

  it("should throttle notifications when throttleMs is set", () => {
    const store = new EngineStore(
      mockEngine,
      { count: 0 },
      { throttleMs: 100 },
    );
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState((_) => ({ count: 1 }));
    store.setState((_) => ({ count: 2 }));
    store.setState((_) => ({ count: 3 }));

    expect(listener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState()).toEqual({ count: 3 });
  });
});
