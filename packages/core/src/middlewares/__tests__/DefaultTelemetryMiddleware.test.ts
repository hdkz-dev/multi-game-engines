import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { DefaultTelemetryMiddleware } from "../DefaultTelemetryMiddleware.js";
import {
  IMiddlewareContext,
  ITelemetryEvent,
  MiddlewarePriority,
} from "../../types.js";

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

  it("should emit search telemetry from onInfo", async () => {
    const info = { depth: 5, raw: "info depth 5" };
    const result = await middleware.onInfo(info, context);
    expect(result).toBe(info);
    expect(emitTelemetrySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "search" }),
    );
  });

  it("should not throw from onInfo when emitTelemetry is missing", async () => {
    const { emitTelemetry: _omit, ...contextNoEmit } = context;
    const info = { raw: "info" };
    const result = await middleware.onInfo(info, contextNoEmit);
    expect(result).toBe(info);
  });

  it("should emit lifecycle telemetry from onProgress", async () => {
    const progress = {
      status: "loading" as const,
      loadedBytes: 500,
      totalBytes: 1000,
    };
    await middleware.onProgress(progress, context);
    expect(emitTelemetrySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "lifecycle" }),
    );
  });

  it("should not throw from onProgress when emitTelemetry is missing", async () => {
    const { emitTelemetry: _omit2, ...contextNoEmit } = context;
    await middleware.onProgress(
      { status: "loading" as const, loadedBytes: 0, totalBytes: 100 },
      contextNoEmit,
    );
  });

  it("should capture memory from performance.memory if available", async () => {
    const mockPerf = performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
    };
    Object.defineProperty(mockPerf, "memory", {
      value: { usedJSHeapSize: 1000, totalJSHeapSize: 2000 },
      configurable: true,
      writable: true,
    });

    await middleware.onCommand("go", context);
    advanceTime(10);
    await middleware.onResult({}, context);

    const call = emitTelemetrySpy.mock.calls[0]?.[0] as {
      metadata?: { memory?: unknown };
    };
    expect(call?.metadata?.memory).toBeDefined();

    Object.defineProperty(mockPerf, "memory", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it("should capture memory from measureUserAgentSpecificMemory if available", async () => {
    const mockPerf = performance as Performance & {
      measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }>;
    };
    mockPerf.measureUserAgentSpecificMemory = async () => ({ bytes: 4096 });

    await middleware.onCommand("go", context);
    advanceTime(10);
    await middleware.onResult({}, context);

    const call = emitTelemetrySpy.mock.calls[0]?.[0] as {
      metadata?: { memory?: unknown };
    };
    expect(call?.metadata?.memory).toBeDefined();

    delete mockPerf.measureUserAgentSpecificMemory;
  });
});
