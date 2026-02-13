import { EngineErrorCode } from "../types.js";

/**
 * エンジン操作中に発生する例外。
 */
export class EngineError extends Error {
  constructor(
    public readonly code: EngineErrorCode,
    message: string,
    public readonly engineId?: string,
    public readonly originalError?: unknown,
    public readonly remediation?: string
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
    
    // 2026 Best Practice: コードに応じた解決策の自動付与
    let code = EngineErrorCode.UNKNOWN_ERROR;
    let remediation: string | undefined;

    if (error instanceof Error) {
      if (error.name === "SecurityError") {
        code = EngineErrorCode.SECURITY_ERROR;
        remediation = "Ensure COOP/COEP headers are correctly set for cross-origin isolation.";
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    return new EngineError(code, message, engineId, error, remediation);
  }
}
