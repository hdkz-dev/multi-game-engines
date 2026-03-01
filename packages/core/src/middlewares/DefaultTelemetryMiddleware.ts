import {
  IMiddleware,
  IMiddlewareContext,
  ITelemetryEvent,
  MiddlewarePriority,
} from "../types.js";

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }>;
}

/**
 * エンジンのパフォーマンスを自動計測する標準テレメトリ・ミドルウェア。
 */
export class DefaultTelemetryMiddleware implements IMiddleware {
  readonly priority = MiddlewarePriority.LOW; // 他のミドルウェアの邪魔をしないよう低優先度

  // 2026 Best Practice: WeakMap による自動クリーンアップ
  // コンテキストが破棄されると、対応する開始時間も自動的にメモリから解放されます。
  private startTimes = new WeakMap<IMiddlewareContext, number>();

  /**
   * 探索コマンド送信時のフック。開始時間を記録します。
   */
  async onCommand(
    command: string | string[] | Uint8Array | Record<string, unknown>,
    context: IMiddlewareContext,
  ): Promise<string | string[] | Uint8Array | Record<string, unknown>> {
    this.startTimes.set(context, performance.now());
    return command;
  }

  /**
   * 探索結果受信時のフック。所要時間を計測しテレメトリを発行します。
   */
  async onResult<T>(result: T, context: IMiddlewareContext): Promise<T> {
    const startTime = this.startTimes.get(context);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.startTimes.delete(context);

      // 2026 Best Practice: メモリ使用量の計測 (Zenith Tier)
      const memory = await this.captureMemoryUsage();

      const event: ITelemetryEvent = {
        type: "performance",
        timestamp: Date.now(),
        duration,
        metadata: {
          action: "search",
          engineId: context.engineId,
          telemetryId: context.telemetryId,
          memory,
        },
      };

      // コンテキスト経由でテレメトリを発行
      if (context.emitTelemetry) {
        context.emitTelemetry(event);
      }
    }
    return result;
  }

  /**
   * 中間思考情報の受信時にテレメトリを発行します。
   */
  async onInfo<T>(info: T, context: IMiddlewareContext): Promise<T> {
    if (context.emitTelemetry) {
      context.emitTelemetry({
        type: "search",
        timestamp: Date.now(),
        metadata: {
          action: "info",
          engineId: context.engineId,
          telemetryId: context.telemetryId,
        },
      });
    }
    return info;
  }

  /**
   * ロード進捗の発生時にテレメトリを発行します。
   */
  async onProgress(
    progress: import("../types.js").ILoadProgress,
    context: IMiddlewareContext,
  ): Promise<void> {
    if (context.emitTelemetry) {
      context.emitTelemetry({
        type: "lifecycle",
        timestamp: Date.now(),
        metadata: {
          action: "progress",
          engineId: context.engineId,
          status: progress.status,
          loadedBytes: progress.loadedBytes,
        },
      });
    }
  }

  private async captureMemoryUsage(): Promise<
    Record<string, number> | undefined
  > {
    const mem: Record<string, number> = {};
    const p = performance as PerformanceWithMemory;

    // 1. Modern API (Zenith Tier 2026)
    if (typeof p.measureUserAgentSpecificMemory === "function") {
      try {
        const result = await p.measureUserAgentSpecificMemory();
        mem.bytes = result.bytes;
      } catch (err) {
        console.debug("[Telemetry] Failed to capture specific memory:", err);
      }
    }

    // 2. Legacy API (Chromium)
    if (p.memory) {
      mem.usedJSHeapSize = p.memory.usedJSHeapSize;
      mem.totalJSHeapSize = p.memory.totalJSHeapSize;
    }

    return Object.keys(mem).length > 0 ? mem : undefined;
  }
}
