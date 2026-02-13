import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DefaultTelemetryMiddleware } from "../middlewares/DefaultTelemetryMiddleware.js";
import { IMiddlewareContext, ITelemetryEvent, MiddlewarePriority } from "../types.js";

describe("DefaultTelemetryMiddleware", () => {
  let middleware: DefaultTelemetryMiddleware;
  let context: IMiddlewareContext;
  let emitTelemetrySpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // performance.now をモックして制御可能な値を返すようにする
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    
    // 時間を進めるヘルパー
    const advanceTime = (ms: number) => {
      now += ms;
      vi.advanceTimersByTime(ms); // Date.now() も同期させる
    };

    middleware = new DefaultTelemetryMiddleware();
    emitTelemetrySpy = vi.fn();
    context = {
      engineId: "test-engine",
      telemetryId: "search-123",
      options: {},
      emitTelemetry: emitTelemetrySpy,
    };

    // テストケース内で advanceTime を使えるようにコンテキスト拡張はできないので
    // ローカル関数として利用する形に修正します。
    // そのため、テストケースごとにロジックを微修正します。
    (globalThis as any).advanceTime = advanceTime;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (globalThis as any).advanceTime;
  });

  it("should have LOW priority", () => {
    expect(middleware.priority).toBe(MiddlewarePriority.LOW);
  });

  it("should measure duration between onCommand and onResult", async () => {
    const advanceTime = (globalThis as any).advanceTime;
    
    // 1. Send Command
    await middleware.onCommand("go", context);

    // 2. Advance Time (100ms)
    advanceTime(100);

    // 3. Receive Result
    await middleware.onResult({ bestMove: "e2e4" }, context);

    // 4. Verify Telemetry
    expect(emitTelemetrySpy).toHaveBeenCalledTimes(1);
    const event: ITelemetryEvent = emitTelemetrySpy.mock.calls[0][0];

    expect(event.type).toBe("performance");
    expect(event.duration).toBe(100);
    expect(event.metadata).toEqual({
      action: "search",
      engineId: "test-engine",
      telemetryId: "search-123",
    });
  });

  it("should handle multiple concurrent contexts correctly", async () => {
    const advanceTime = (globalThis as any).advanceTime;
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
    expect(emitTelemetrySpy).toHaveBeenLastCalledWith(expect.objectContaining({
      duration: 100,
      metadata: expect.objectContaining({ telemetryId: "id-1" })
    }));

    advanceTime(50);

    // Finish 2 (Total 100ms since Start 2)
    // Start 2 was at T+50, Current is T+150 -> Duration 100
    await middleware.onResult({}, context2);
    expect(emitTelemetrySpy).toHaveBeenLastCalledWith(expect.objectContaining({
      duration: 100,
      metadata: expect.objectContaining({ telemetryId: "id-2" })
    }));
  });

  it("should not emit telemetry if start time is missing (e.g. unexpected result flow)", async () => {
    await middleware.onResult({}, context);
    expect(emitTelemetrySpy).not.toHaveBeenCalled();
  });
});
