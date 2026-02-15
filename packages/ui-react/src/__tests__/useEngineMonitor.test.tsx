import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEngineMonitor } from "../useEngineMonitor.js";
import { IEngine, IBaseSearchOptions } from "@multi-game-engines/core";

describe("useEngineMonitor", () => {
  const mockEngine = {
    id: "test",
    status: "ready",
    onInfo: vi.fn(() => () => {}),
    onStatusChange: vi.fn(() => () => {}),
    search: vi.fn(),
    stop: vi.fn(),
  } as unknown as IEngine;

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useEngineMonitor(mockEngine));

    expect(result.current.state.stats.depth).toBe(0);
    expect(result.current.status).toBe("ready");
  });

  it("should call engine.search when search is called", async () => {
    const { result } = renderHook(() => useEngineMonitor(mockEngine));

    await act(async () => {
      await result.current.search({} as IBaseSearchOptions);
    });

    expect(mockEngine.search).toHaveBeenCalled();
  });
});
