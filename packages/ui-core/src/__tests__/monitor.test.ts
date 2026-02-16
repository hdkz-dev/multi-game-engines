import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchMonitor } from "../monitor.js";
import {
  IEngine,
  IBaseSearchInfo,
  IBaseSearchOptions,
  IBaseSearchResult,
} from "@multi-game-engines/core";

describe("SearchMonitor", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(Date.now()), 16);
    });
  });

  it("should bridge engine events to store", async () => {
    let infoCallback: (info: IBaseSearchInfo) => void = () => {};
    const mockEngine = {
      status: "ready",
      onInfo: vi.fn((cb) => {
        infoCallback = cb;
        return () => {};
      }),
      onStatusChange: vi.fn(() => () => {}),
      search: vi.fn(),
      stop: vi.fn(),
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    const transformer = (
      state: Record<string, unknown>,
      info: IBaseSearchInfo,
    ) => ({ ...state, lastInfo: info });
    const monitor = new SearchMonitor(
      mockEngine,
      { lastInfo: null },
      transformer,
    );

    monitor.startMonitoring();
    expect(mockEngine.onInfo).toHaveBeenCalled();

    const listener = vi.fn();
    monitor.subscribe(listener);

    infoCallback({ raw: "depth 10" });

    await new Promise((r) => requestAnimationFrame(r as () => void));

    expect(monitor.getState()).toEqual({ lastInfo: { raw: "depth 10" } });
  });

  it("should stop monitoring correctly", () => {
    const unsubInfo = vi.fn();
    const mockEngine = {
      onInfo: vi.fn(() => unsubInfo),
      onStatusChange: vi.fn(() => () => {}),
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    const monitor = new SearchMonitor(mockEngine, {}, (s) => s);
    monitor.startMonitoring();
    monitor.stopMonitoring();

    expect(unsubInfo).toHaveBeenCalled();
  });
});
