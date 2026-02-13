import { IMiddleware, IMiddlewareContext, ITelemetryEvent, MiddlewarePriority } from "../types.js";

/**
 * エンジンのパフォーマンスを自動計測する標準テレメトリ・ミドルウェア。
 */
export class DefaultTelemetryMiddleware implements IMiddleware {
  readonly priority = MiddlewarePriority.LOW; // 他のミドルウェアの邪魔をしないよう低優先度

  private startTimes = new Map<string, number>();

  /**
   * 探索コマンド送信時のフック。開始時間を記録します。
   */
  async onCommand(
    command: string | string[] | Uint8Array | Record<string, unknown>,
    context: IMiddlewareContext
  ): Promise<string | string[] | Uint8Array | Record<string, unknown>> {
    const key = this.getLookupKey(context);
    this.startTimes.set(key, performance.now());
    return command;
  }

  /**
   * 探索結果受信時のフック。所要時間を計測しテレメトリを発行します。
   */
  async onResult<T>(result: T, context: IMiddlewareContext): Promise<T> {
    const key = this.getLookupKey(context);
    const startTime = this.startTimes.get(key);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.startTimes.delete(key);

      // テレメトリイベントの構築 (2026 Standard)
      const event: ITelemetryEvent = {
        type: "performance",
        timestamp: Date.now(),
        duration,
        metadata: {
          action: "search",
          engineId: context.engineId,
          telemetryId: context.telemetryId,
        }
      };

      // コンテキスト経由でテレメトリを発行
      context.emitTelemetry(event);
    }
    return result;
  }

  private getLookupKey(context: IMiddlewareContext): string {
    return `${context.engineId}:${context.telemetryId ?? "default"}`;
  }
}
