import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchMonitor } from "../monitor.js";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";

// Mock type definitions
type MockState = { count: number; lastRaw: string };
type MockInfo = { raw: string };

const createMockInfo = (raw: string): MockInfo & IBaseSearchInfo => ({
  raw,
  depth: 1,
  seldepth: 1,
  nodes: 1,
  nps: 1,
  time: 1,
  multipv: 1,
  pv: [],
});

describe("SearchMonitor (Throttling)", () => {
  let mockEngine: IEngine<
    IBaseSearchOptions,
    MockInfo & IBaseSearchInfo,
    IBaseSearchResult
  >;
  let infoCallback: (info: MockInfo & IBaseSearchInfo) => void;

  beforeEach(() => {
    vi.useFakeTimers();
    infoCallback = () => {};
    mockEngine = {
      id: "mock-engine",
      name: "Mock Engine",
      version: "1.0.0",
      status: "ready",
      onInfo: vi.fn((cb) => {
        infoCallback = cb;
        return () => {};
      }),
      onStatusChange: vi.fn(() => () => {}),
      search: vi.fn(),
      stop: vi.fn(),
      use: vi.fn(),
      emitTelemetry: vi.fn(),
    } as unknown as IEngine<
      IBaseSearchOptions,
      MockInfo & IBaseSearchInfo,
      IBaseSearchResult
    >;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("should batch multiple updates into a single state notification", async () => {
    // Transformation logic: increment count and store last raw message
    const transformer = vi.fn((state: MockState, info: MockInfo) => ({
      count: state.count + 1,
      lastRaw: info.raw,
    }));

    const monitor = new SearchMonitor<
      MockState,
      IBaseSearchOptions,
      MockInfo & IBaseSearchInfo,
      IBaseSearchResult
    >(mockEngine, { count: 0, lastRaw: "" }, transformer);

    const listener = vi.fn();
    monitor.subscribe(listener);

    monitor.startMonitoring();

    // 1. Trigger multiple updates in a short period
    infoCallback(createMockInfo("msg1"));
    infoCallback(createMockInfo("msg2"));
    infoCallback(createMockInfo("msg3"));

    // Async processing hasn't happened yet, so updates shouldn't be reflected
    expect(listener).not.toHaveBeenCalled();
    expect(transformer).not.toHaveBeenCalled();

    // 2. Advance timers (requestAnimationFrame / setTimeout trigger)
    await vi.runAllTimersAsync();

    // 3. Validation
    // Transformer should be called for each received message
    expect(transformer).toHaveBeenCalledTimes(3);

    // But notification to store listeners (re-render) should be batched to once
    expect(listener).toHaveBeenCalledTimes(1);

    // Final state check
    const state = monitor.getState();
    expect(state.count).toBe(3);
    expect(state.lastRaw).toBe("msg3");
  });

  it("should stop processing updates after stopMonitoring", async () => {
    const transformer = (state: MockState, info: MockInfo) => ({
      ...state,
      lastRaw: info.raw,
    });

    const monitor = new SearchMonitor<
      MockState,
      IBaseSearchOptions,
      MockInfo & IBaseSearchInfo,
      IBaseSearchResult
    >(mockEngine, { count: 0, lastRaw: "" }, transformer);

    monitor.startMonitoring();
    infoCallback(createMockInfo("msg1"));

    // Stop before processing
    monitor.stopMonitoring();

    await vi.runAllTimersAsync();

    // Updates should not be reflected after stopping
    expect(monitor.getState().lastRaw).toBe("");
  });

  it("should use requestAnimationFrame when available and cancel on stop", async () => {
    const cancelRAF = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancelRAF);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      setTimeout(cb, 16);
      return 42;
    });

    const transformer = (state: MockState) => state;
    const monitor = new SearchMonitor<
      MockState,
      IBaseSearchOptions,
      MockInfo & IBaseSearchInfo,
      IBaseSearchResult
    >(mockEngine, { count: 0, lastRaw: "" }, transformer);

    monitor.startMonitoring();
    infoCallback(createMockInfo("msg1"));
    monitor.stopMonitoring();

    await vi.runAllTimersAsync();
    expect(cancelRAF).toHaveBeenCalledWith(42);
  });

  it("should handle empty pendingUpdates in processUpdates (timer fires after stop)", async () => {
    const transformer = (state: MockState) => state;
    const monitor = new SearchMonitor<
      MockState,
      IBaseSearchOptions,
      MockInfo & IBaseSearchInfo,
      IBaseSearchResult
    >(mockEngine, { count: 0, lastRaw: "" }, transformer);

    monitor.startMonitoring();
    infoCallback(createMockInfo("msg1"));
    monitor.stopMonitoring();
    await vi.runAllTimersAsync();
    expect(monitor.getState().lastRaw).toBe("");
  });

  it("should expose getSnapshot, search, stop, and getStatus", async () => {
    const transformer = (state: MockState) => state;
    const monitor = new SearchMonitor<
      MockState,
      IBaseSearchOptions,
      MockInfo & IBaseSearchInfo,
      IBaseSearchResult
    >(mockEngine, { count: 0, lastRaw: "" }, transformer);

    monitor.startMonitoring();

    expect(monitor.getSnapshot()).toEqual({ count: 0, lastRaw: "" });
    expect(monitor.getStatus()).toBe("ready");

    vi.mocked(mockEngine.search).mockResolvedValue({} as IBaseSearchResult);
    await monitor.search({} as IBaseSearchOptions);
    expect(mockEngine.search).toHaveBeenCalled();

    vi.mocked(mockEngine.stop).mockResolvedValue(undefined);
    await monitor.stop();
    expect(mockEngine.stop).toHaveBeenCalled();
  });
});
