import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EngineError,
  EngineErrorCode,
  type EngineStatus,
} from "@multi-game-engines/core";
import { CommandDispatcher } from "../CommandDispatcher.js";

function setup() {
  const monitor = {
    getStatus: vi.fn<() => EngineStatus>().mockReturnValue("ready"),
    search: vi.fn<() => Promise<never>>(),
    stop: vi.fn<() => Promise<void>>(),
  };
  const updateStatus = vi.fn();
  return {
    monitor,
    updateStatus,
    dispatcher: new CommandDispatcher(monitor, updateStatus),
  };
}

afterEach(() => vi.restoreAllMocks());

describe("CommandDispatcher failure handling", () => {
  it("preserves cancellation for callers without reporting a search failure", async () => {
    const { monitor, dispatcher, updateStatus } = setup();
    const error = new EngineError({
      code: EngineErrorCode.SEARCH_ABORTED,
      message: "Stop requested",
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    monitor.search.mockRejectedValue(error);
    await expect(dispatcher.dispatchSearch({})).rejects.toBe(error);
    expect(updateStatus).toHaveBeenLastCalledWith("ready");
    expect(log).not.toHaveBeenCalled();
  });

  it("reports and propagates unexpected search failures", async () => {
    const { monitor, dispatcher, updateStatus } = setup();
    const error = new Error("Search transport failed");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    monitor.search.mockRejectedValue(error);
    await expect(dispatcher.dispatchSearch({})).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith(
      "[CommandDispatcher] Search failed:",
      error,
    );
    expect(updateStatus).toHaveBeenLastCalledWith("ready");
  });

  it("reports stop failures and restores the prior status", async () => {
    const { monitor, dispatcher, updateStatus } = setup();
    const error = new Error("Stop transport failed");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    monitor.getStatus.mockReturnValue("busy");
    monitor.stop.mockRejectedValue(error);
    await expect(dispatcher.dispatchStop()).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith(
      "[CommandDispatcher] Failed to stop engine:",
      error,
    );
    expect(updateStatus).toHaveBeenLastCalledWith("busy");
  });
});
