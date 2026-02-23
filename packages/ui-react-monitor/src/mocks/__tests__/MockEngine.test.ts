import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockEngine } from "../MockEngine.js";
import { IBaseSearchOptions } from "@multi-game-engines/core";

describe("MockEngine", () => {
  let engine: MockEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new MockEngine();
  });

  afterEach(async () => {
    await engine.dispose();
    vi.useRealTimers();
  });

  it("should transition status from busy to ready when starting a new search", async () => {
    // Start first search
    // MockEngine.search returns immediately but starts an interval
    await engine.search({ depth: 10 } as IBaseSearchOptions);

    // Now it should be busy
    expect(engine.status).toBe("busy");

    // Start second search while first is busy
    await engine.search({ depth: 20 } as IBaseSearchOptions);

    // Should still be busy (restarted)
    expect(engine.status).toBe("busy");

    // Stop explicitly
    await engine.stop();
    expect(engine.status).toBe("ready");
  });

  it("should verify status sequence during search restart", async () => {
    const stopSpy = vi.spyOn(engine, "stop");

    // First search
    await engine.search({} as IBaseSearchOptions);
    expect(engine.status).toBe("busy");

    // Second search
    await engine.search({} as IBaseSearchOptions);

    // stop() must be called to reset the engine before the new search
    expect(stopSpy).toHaveBeenCalled();
  });

  it("should handle rapid sequential search calls correctly", async () => {
    const onInfo = vi.fn();
    const cleanup = engine.onInfo(onInfo);

    // Call search multiple times
    await engine.search({ depth: 1 });
    await engine.search({ depth: 2 });
    await engine.search({ depth: 3 });

    // Advance time to let interval fire, but not finish (finish at depth 10 = 1000ms approx)
    await vi.advanceTimersByTimeAsync(500);

    expect(engine.status).toBe("busy");

    await engine.stop();
    expect(onInfo).toHaveBeenCalled();
    cleanup();
  });
});
