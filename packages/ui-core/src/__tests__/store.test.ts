import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineStore } from "../store.js";
import { IEngine } from "@multi-game-engines/core";

describe("EngineStore", () => {
  const mockEngine = { status: "ready" } as unknown as IEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(Date.now()), 16);
    });
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

    vi.runAllTimers();
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

  it("should correctly handle unsubscribe", () => {
    const store = new EngineStore(mockEngine, { count: 0 });
    const listener = vi.fn();
    const unsub = store.subscribe(listener);

    unsub();
    store.setState((_) => ({ count: 1 }));
    vi.runAllTimers();

    expect(listener).toHaveBeenCalledTimes(0);
  });
});
