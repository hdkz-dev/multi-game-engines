import { EngineErrorCode } from "../types.js";

/**
 * エンジン操作中に発生する例外。
 */
export class EngineError extends Error {
  constructor(
    public readonly code: EngineErrorCode,
    message: string,
    public readonly engineId?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "EngineError";
    // 2026 Best Practice: Error.captureStackTrace (if available)
    if ("captureStackTrace" in Error) {
      (Error as unknown as { captureStackTrace: (target: object, constructor: unknown) => void }).captureStackTrace(this, EngineError);
    }
  }

  static from(error: unknown, engineId?: string): EngineError {
    if (error instanceof EngineError) return error;
    const message = error instanceof Error ? error.message : String(error);
    return new EngineError(EngineErrorCode.UNKNOWN_ERROR, message, engineId, error);
  }
}
