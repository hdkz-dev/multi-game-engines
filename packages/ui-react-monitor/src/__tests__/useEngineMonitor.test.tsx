import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEngineMonitor } from "../useEngineMonitor.js";
import { MonitorRegistry } from "@multi-game-engines/ui-core";
import { IEngine, IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult } from "@multi-game-engines/core";

describe("useEngineMonitor", () => {
  // 2026 Zenith Practice: 型安全なモック定義
  const mockEngine: Partial<
    IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>
  > = {
    id: "test",
    status: "ready" as const,
    onInfo: vi.fn(() => () => {}),
    onSearchResult: vi.fn(() => () => {}),
    onStatusChange: vi.fn(() => () => {}),
    onTelemetry: vi.fn(() => () => {}),
    emitTelemetry: vi.fn(),
    search: vi.fn(),
    stop: vi.fn(),
    use: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
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
});
