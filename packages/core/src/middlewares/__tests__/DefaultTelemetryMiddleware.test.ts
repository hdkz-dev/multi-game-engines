import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { DefaultTelemetryMiddleware } from "../DefaultTelemetryMiddleware.js";
import { IMiddlewareContext,
  ITelemetryEvent,
  MiddlewarePriority, } from "../../types.js";

describe("DefaultTelemetryMiddleware", () => {
  let middleware: DefaultTelemetryMiddleware;
  let context: IMiddlewareContext;
  let emitTelemetrySpy: Mock<(event: ITelemetryEvent) => void>;

  // Test control variables
  let currentTime = 1000;

  const advanceTime = (ms: number) => {
    currentTime += ms;
    vi.advanceTimersByTime(ms);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    currentTime = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => currentTime);

    middleware = new DefaultTelemetryMiddleware();
    emitTelemetrySpy = vi.fn();
    context = {
      engineId: "test-engine",
      telemetryId: "search-123",
      options: {},
      emitTelemetry: emitTelemetrySpy,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should have LOW priority", () => {
    expect(middleware.priority).toBe(MiddlewarePriority.LOW);
  });

  it("should measure duration between onCommand and onResult", async () => {
    // 1. Send Command
    await middleware.onCommand("go", context);

    // 2. Advance Time (100ms)
    advanceTime(100);

    // 3. Receive Result
    await middleware.onResult({ bestMove: "e2e4" }, context);

    // 4. Verify Telemetry
    expect(emitTelemetrySpy).toHaveBeenCalledTimes(1);
    const firstCall = emitTelemetrySpy.mock.calls[0];
    if (!firstCall) throw new Error("Expected at least one call");
    const event: ITelemetryEvent = firstCall[0];

    expect(event.type).toBe("performance");
    expect(event.duration).toBe(100);
    expect(event.metadata).toEqual({
      action: "search",
      engineId: "test-engine",
      telemetryId: "search-123",
    });
  });

  it("should handle multiple concurrent contexts correctly", async () => {
    const context1 = { ...context, telemetryId: "id-1" };
    const context2 = { ...context, telemetryId: "id-2" };

    // Start 1
    await middleware.onCommand("go 1", context1);
    advanceTime(50);

    // Start 2
    await middleware.onCommand("go 2", context2);
    advanceTime(50);

    // Finish 1 (Total 100ms)
    await middleware.onResult({}, context1);
    expect(emitTelemetrySpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        duration: 100,
        metadata: expect.objectContaining({ telemetryId: "id-1" }),
      }),
    );

    advanceTime(50);

    // Finish 2 (Total 100ms since Start 2)
    // Start 2 was at T+50, Current is T+150 -> Duration 100
    await middleware.onResult({}, context2);
    expect(emitTelemetrySpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        duration: 100,
        metadata: expect.objectContaining({ telemetryId: "id-2" }),
      }),
    );
  });

  it("should not emit telemetry if start time is missing (e.g. unexpected result flow)", async () => {
    await middleware.onResult({}, context);
    expect(emitTelemetrySpy).not.toHaveBeenCalled();
  });
});
