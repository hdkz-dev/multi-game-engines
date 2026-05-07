import type { ITelemetryEvent } from "../types.js";

/**
 * OpenTelemetry Tracer の最小インターフェース。
 * `@opentelemetry/api` の型と互換性があります。
 */
export interface IOtelTracer {
  startActiveSpan<F extends (span: IOtelSpan) => ReturnType<F>>(
    name: string,
    fn: F,
  ): ReturnType<F>;
  startSpan(name: string, options?: { startTime?: number }): IOtelSpan;
}

export interface IOtelSpan {
  setAttribute(key: string, value: string | number | boolean): this;
  setStatus(status: { code: number; message?: string }): this;
  end(endTime?: number): void;
}

/**
 * OpenTelemetry の SpanStatusCode の最小定義。
 */
export const OtelSpanStatusCode = {
  UNSET: 0,
  OK: 1,
  ERROR: 2,
} as const;

/**
 * `ITelemetryEvent` を OpenTelemetry スパンにブリッジするアダプター。
 *
 * アプリケーションが `@opentelemetry/api` をインストールしている場合、
 * `OtelBridge.fromGlobal()` でグローバルトレーサーを取得するか、
 * コンストラクタに任意の `IOtelTracer` を渡してください。
 *
 * @example
 * ```ts
 * import { OtelBridge } from "@multi-game-engines/core";
 * import { trace } from "@opentelemetry/api";
 *
 * const bridge = new OtelBridge(trace.getTracer("multi-game-engines"));
 * engine.onTelemetry((event) => bridge.record(event));
 * ```
 */
export class OtelBridge {
  private readonly tracer: IOtelTracer;

  constructor(tracer: IOtelTracer) {
    this.tracer = tracer;
  }

  /**
   * `@opentelemetry/api` のグローバルトレーサーを使用して `OtelBridge` を作成します。
   * `@opentelemetry/api` がインストールされていない場合は `null` を返します。
   *
   * @example
   * ```ts
   * // アプリ側で @opentelemetry/api をインストールしている場合のみ有効
   * const bridge = await OtelBridge.fromGlobal("my-chess-app");
   * if (bridge) engine.onTelemetry(bridge.asCallback());
   * ```
   */
  static async fromGlobal(
    name = "multi-game-engines",
    version?: string,
  ): Promise<OtelBridge | null> {
    try {
      // 動的インポート: otel は optionalPeerDependency のため存在しない環境でも安全
       
      const api = await (new Function(
        'return import("@opentelemetry/api")',
      )() as Promise<{
        trace: { getTracer(name: string, version?: string): IOtelTracer };
      }>);
      const tracer = api.trace.getTracer(name, version);
      return new OtelBridge(tracer);
    } catch {
      return null;
    }
  }

  /**
   * `ITelemetryEvent` を OTel スパンとして記録します。
   *
   * - `type === "performance"` → `search.duration` (ms) 属性付きスパン
   * - `type === "lifecycle"` → `engine.progress` スパン
   * - その他 → `engine.${type}` スパン
   */
  record(event: ITelemetryEvent): void {
    const spanName = this.spanNameFor(event);
    const span = this.tracer.startSpan(spanName, {
      startTime: event.timestamp,
    });

    span.setAttribute(
      "engine.id",
      String(event.metadata["engineId"] ?? "unknown"),
    );

    if (event.duration !== undefined) {
      span.setAttribute("engine.duration_ms", event.duration);
    }

    for (const [key, value] of Object.entries(event.metadata)) {
      if (key === "engineId") continue;
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        span.setAttribute(`engine.${key}`, value);
      }
    }

    span.setStatus({ code: OtelSpanStatusCode.OK });
    span.end(event.timestamp + (event.duration ?? 0));
  }

  /**
   * `IEngine.onTelemetry` に渡せるコールバックを返します。
   *
   * @example
   * ```ts
   * engine.onTelemetry(bridge.asCallback());
   * ```
   */
  asCallback(): (event: ITelemetryEvent) => void {
    return (event) => this.record(event);
  }

  private spanNameFor(event: ITelemetryEvent): string {
    switch (event.type) {
      case "performance":
        return "engine.search";
      case "lifecycle":
        return "engine.lifecycle";
      case "search":
        return "engine.info";
      default:
        return `engine.${event.type}`;
    }
  }
}
