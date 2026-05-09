import { describe, it, expect, vi, beforeEach } from "vitest";
import { OtelBridge, OtelSpanStatusCode } from "../OtelBridge.js";
import type { IOtelSpan, IOtelTracer } from "../OtelBridge.js";
import type { ITelemetryEvent } from "../../types.js";

function makeSpan(): IOtelSpan & {
  _attrs: Record<string, unknown>;
  _status: unknown;
  _ended: boolean;
} {
  const span = {
    _attrs: {} as Record<string, unknown>,
    _status: undefined as unknown,
    _ended: false,
    setAttribute(k: string, v: string | number | boolean) {
      span._attrs[k] = v;
      return span;
    },
    setStatus(s: { code: number }) {
      span._status = s;
      return span;
    },
    end() {
      span._ended = true;
    },
  };
  return span;
}

function makeTracer(): IOtelTracer & {
  lastSpan: ReturnType<typeof makeSpan> | null;
} {
  const tracer = {
    lastSpan: null as ReturnType<typeof makeSpan> | null,
    startActiveSpan<F extends (span: IOtelSpan) => ReturnType<F>>(
      name: string,
      fn: F,
    ) {
      const span = makeSpan();
      tracer.lastSpan = span;
      return fn(span);
    },
    startSpan(_name: string, _opts?: { startTime?: number }) {
      const span = makeSpan();
      tracer.lastSpan = span;
      return span;
    },
  };
  return tracer;
}

describe("OtelBridge", () => {
  let tracer: ReturnType<typeof makeTracer>;
  let bridge: OtelBridge;

  beforeEach(() => {
    tracer = makeTracer();
    bridge = new OtelBridge(tracer);
  });

  it("records performance event as engine.search span", () => {
    const event: ITelemetryEvent = {
      type: "performance",
      timestamp: 1000,
      duration: 42,
      metadata: { engineId: "sf16", action: "search" },
    };
    bridge.record(event);

    const span = tracer.lastSpan!;
    expect(span._ended).toBe(true);
    expect(span._attrs["engine.id"]).toBe("sf16");
    expect(span._attrs["engine.duration_ms"]).toBe(42);
    expect(span._attrs["engine.action"]).toBe("search");
    expect(span._status).toEqual({ code: OtelSpanStatusCode.OK });
  });

  it("records lifecycle event and skips engineId duplication", () => {
    const event: ITelemetryEvent = {
      type: "lifecycle",
      timestamp: 2000,
      metadata: { engineId: "katago", action: "progress", loadedBytes: 1024 },
    };
    bridge.record(event);

    const span = tracer.lastSpan!;
    expect(span._attrs["engine.id"]).toBe("katago");
    expect(span._attrs["engine.action"]).toBe("progress");
    expect(span._attrs["engine.loadedBytes"]).toBe(1024);
    expect(span._attrs["engine.engineId"]).toBeUndefined();
  });

  it("records search (info) event without duration attribute when duration is absent", () => {
    const event: ITelemetryEvent = {
      type: "search",
      timestamp: 3000,
      metadata: { engineId: "yaneuraou", action: "info" },
    };
    bridge.record(event);

    const span = tracer.lastSpan!;
    expect(span._attrs["engine.duration_ms"]).toBeUndefined();
    expect(span._ended).toBe(true);
  });

  it("falls back to 'unknown' engineId when metadata.engineId is missing", () => {
    const event: ITelemetryEvent = {
      type: "performance",
      timestamp: 4000,
      duration: 10,
      metadata: {},
    };
    bridge.record(event);

    const span = tracer.lastSpan!;
    expect(span._attrs["engine.id"]).toBe("unknown");
  });

  it("skips non-primitive metadata values", () => {
    const event: ITelemetryEvent = {
      type: "performance",
      timestamp: 5000,
      duration: 5,
      metadata: { engineId: "edax", nestedObj: { deep: true } },
    };
    bridge.record(event);

    const span = tracer.lastSpan!;
    expect(span._attrs["engine.nestedObj"]).toBeUndefined();
  });

  it("asCallback() returns a function that calls record()", () => {
    const recordSpy = vi.spyOn(bridge, "record");
    const cb = bridge.asCallback();

    const event: ITelemetryEvent = {
      type: "performance",
      timestamp: 6000,
      duration: 1,
      metadata: { engineId: "stockfish" },
    };
    cb(event);

    expect(recordSpy).toHaveBeenCalledWith(event);
  });

  it("fromGlobal() returns null when @opentelemetry/api is not installed", async () => {
    const result = await OtelBridge.fromGlobal();
    // テスト環境では @opentelemetry/api は devDep にないため null を返す
    expect(result).toBeNull();
  });

  it("uses engine.{type} span name as a fallback for unknown event types", () => {
    const event = {
      type: "custom-bench" as unknown as ITelemetryEvent["type"],
      timestamp: 7000,
      metadata: { engineId: "x" },
    } as ITelemetryEvent;

    const startSpy = vi.spyOn(tracer, "startSpan");
    bridge.record(event);
    expect(startSpy).toHaveBeenCalledWith(
      "engine.custom-bench",
      expect.any(Object),
    );
  });
});
