import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEngineMonitor } from "../useEngineMonitor.js";
import { MonitorRegistry } from "@multi-game-engines/ui-core";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";

describe("useEngineMonitor", () => {
  // 2026 Zenith Practice: 型安全なモック定義
  let statusListeners: ((s: ReturnType<typeof String>) => void)[] = [];
  const mockEngine: Partial<
    IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>
  > = {
    id: "test",
    status: "ready" as const,
    onInfo: vi.fn(() => () => {}),
    onSearchResult: vi.fn(() => () => {}),
    onStatusChange: vi.fn((cb) => {
      statusListeners.push(cb);
      return () => {
        statusListeners = statusListeners.filter((l) => l !== cb);
      };
    }),
    onTelemetry: vi.fn(() => () => {}),
    emitTelemetry: vi.fn(),
    search: vi.fn(),
    stop: vi.fn(),
    use: vi.fn().mockReturnThis(),
    unuse: vi.fn(),
  };

  beforeEach(() => {
    statusListeners = [];
    MonitorRegistry.reset();
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() =>
      useEngineMonitor(
        mockEngine as IEngine<
          IBaseSearchOptions,
          IBaseSearchInfo,
          IBaseSearchResult
        >,
      ),
    );

    expect(result.current.state.stats.depth).toBe(0);
    expect(result.current.status).toBe("ready");
  });

  it("should call engine.search with correct options", async () => {
    const { result } = renderHook(() =>
      useEngineMonitor(
        mockEngine as IEngine<
          IBaseSearchOptions,
          IBaseSearchInfo,
          IBaseSearchResult
        >,
      ),
    );
    const options: IBaseSearchOptions = {
      signal: new AbortController().signal,
    };

    await act(async () => {
      await result.current.search(options);
    });

    expect(mockEngine.search).toHaveBeenCalledWith(options);
  });

  it("should call stop on dispatcher when stop is called", async () => {
    const { result } = renderHook(() =>
      useEngineMonitor(
        mockEngine as IEngine<
          IBaseSearchOptions,
          IBaseSearchInfo,
          IBaseSearchResult
        >,
      ),
    );

    await act(async () => {
      result.current.stop();
    });

    expect(mockEngine.stop).toHaveBeenCalled();
  });

  it("should update status when engine emits status change", async () => {
    const { result } = renderHook(() =>
      useEngineMonitor(
        mockEngine as IEngine<
          IBaseSearchOptions,
          IBaseSearchInfo,
          IBaseSearchResult
        >,
      ),
    );

    await act(async () => {
      statusListeners.forEach((l) => l("busy" as never));
    });

    expect(result.current.status).toBe("busy");
  });

  it("should clean up monitoring on unmount", async () => {
    const { unmount } = renderHook(() =>
      useEngineMonitor(
        mockEngine as IEngine<
          IBaseSearchOptions,
          IBaseSearchInfo,
          IBaseSearchResult
        >,
      ),
    );

    unmount();
    expect(statusListeners).toHaveLength(0);
  });

  it("should return dummyState and reject search when engine is null", async () => {
    const { result } = renderHook(() => useEngineMonitor(null));

    expect(result.current.state.stats.depth).toBe(0);

    await expect(
      result.current.search({} as IBaseSearchOptions),
    ).rejects.toThrow();
  });

  it("should not throw when stop is called with null engine", async () => {
    const { result } = renderHook(() => useEngineMonitor(null));

    await act(async () => {
      result.current.stop();
    });

    // When engine is null, status is "uninitialized" or "ready" (dummyState)
    expect(result.current.state.stats.depth).toBe(0);
  });
});
