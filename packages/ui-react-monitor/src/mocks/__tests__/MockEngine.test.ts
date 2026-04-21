import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockEngine } from "../MockEngine.js";

describe("MockEngine", () => {
  let engine: MockEngine;

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "Date",
      ],
    });
    engine = new MockEngine();
  });

  afterEach(async () => {
    await engine.dispose();
    vi.useRealTimers();
  });

  it("should transition status from busy to ready when starting a new search", async () => {
    // Start first search
    // MockEngine.search returns immediately but starts an interval
    await engine.search({ depth: 10 });

    // Now it should be busy
    expect(engine.status).toBe("busy");

    // Start second search while first is busy
    await engine.search({ depth: 20 });

    // Should still be busy (restarted)
    expect(engine.status).toBe("busy");

    // Stop explicitly
    await engine.stop();
    expect(engine.status).toBe("ready");
  });

  it("should verify status sequence during search restart", async () => {
    const statusHistory: string[] = [];
    engine.onStatusChange((s) => statusHistory.push(s));

    const stopSpy = vi.spyOn(engine, "stop");

    // First search
    await engine.search({});
    expect(engine.status).toBe("busy");
    // Clear initial call from first search to focus on restart behavior
    stopSpy.mockClear();

    // Second search: should call stop (ready) then become busy again
    await engine.search({});
    expect(engine.status).toBe("busy");

    // stop() must be called to reset the engine before the new search
    expect(stopSpy).toHaveBeenCalledTimes(1);

    // History should contain: ready (init) -> busy -> ready (via stop) -> busy
    // Filter out initial 'ready' if needed, but here we check the flow
    expect(statusHistory).toContain("busy");
    expect(statusHistory).toContain("ready");

    const busyIndices = statusHistory
      .map((s, i) => (s === "busy" ? i : -1))
      .filter((i) => i !== -1);
    const readyIndices = statusHistory
      .map((s, i) => (s === "ready" ? i : -1))
      .filter((i) => i !== -1);

    // There should be a 'ready' state between two 'busy' states during restart
    expect(busyIndices.length).toBeGreaterThanOrEqual(2);
    expect(
      readyIndices.some((r) => r > busyIndices[0]! && r < busyIndices[1]!),
    ).toBe(true);
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

  it("should call onSearchResult listeners when search completes", async () => {
    const onResult = vi.fn();
    const cleanup = engine.onSearchResult(onResult);

    await engine.search({});
    // Advance past 10 ticks (depth 10 triggers result)
    await vi.advanceTimersByTimeAsync(1100);

    expect(onResult).toHaveBeenCalled();
    cleanup();
  });

  it("should load: go through loading -> ready status", async () => {
    const statuses: string[] = [];
    engine.onStatusChange((s) => statuses.push(s));
    const loadPromise = engine.load();
    await vi.advanceTimersByTimeAsync(600);
    await loadPromise;
    expect(statuses).toContain("loading");
    expect(statuses).toContain("ready");
  });

  it("should set lastError and throw when failOnSearch is true", async () => {
    const failEngine = new MockEngine({ failOnSearch: true });
    await expect(failEngine.search({})).rejects.toThrow();
    expect(failEngine.lastError).not.toBeNull();
    expect(failEngine.status).toBe("error");
    await failEngine.dispose();
  });

  it("should support use and unuse middleware without throwing", () => {
    const middleware = {
      id: "test-middleware",
      onInfo: vi.fn(),
    };
    const result = engine.use(middleware as never);
    expect(result).toBe(engine);

    engine.unuse(middleware as never);
    engine.unuse("test-middleware");
  });

  it("should return unsubscribe noop from onProgress", () => {
    const cleanup = engine.onProgress(vi.fn());
    expect(typeof cleanup).toBe("function");
    cleanup();
  });

  it("should call onTelemetry listeners and support unsubscribe", () => {
    const onTelemetry = vi.fn();
    const cleanup = engine.onTelemetry(onTelemetry);

    engine.emitTelemetry({
      type: "lifecycle",
      timestamp: Date.now(),
      metadata: {
        component: "test",
        action: "test_action",
        engineId: engine.id,
      },
    });

    expect(onTelemetry).toHaveBeenCalledTimes(1);

    cleanup();
    engine.emitTelemetry({
      type: "lifecycle",
      timestamp: Date.now(),
      metadata: {
        component: "test",
        action: "after_unsubscribe",
        engineId: engine.id,
      },
    });
    expect(onTelemetry).toHaveBeenCalledTimes(1);
  });
});
