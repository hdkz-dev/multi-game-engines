import { EngineErrorCode } from "../types.js";

/** エンジンエラーの構築オプション */
export interface IEngineErrorOptions {
  code: EngineErrorCode;
  message: string;
  engineId?: string;
  originalError?: unknown;
  /** 
   * 解決策の提示 (開発者向けデバッグ情報) 
   * 将来的にユーザーへ表示する場合は i18n キーへの置き換えを検討してください。
   */
  remediation?: string;
}

/**
 * エンジン操作中に発生する例外。
 */
export class EngineError extends Error {
  public readonly code: EngineErrorCode;
  public readonly engineId?: string;
  public readonly originalError?: unknown;
  public readonly remediation?: string;

  constructor(opts: IEngineErrorOptions) {
    super(opts.message);
    this.name = "EngineError";
    this.code = opts.code;
    this.engineId = opts.engineId;
    this.originalError = opts.originalError;
    this.remediation = opts.remediation;

    // 2026 Best Practice: Error.captureStackTrace (if available)
    if ("captureStackTrace" in Error) {
      (Error as unknown as { captureStackTrace: (target: object, constructor: unknown) => void }).captureStackTrace(this, EngineError);
    }
  }

  static from(error: unknown, engineId?: string): EngineError {
    if (error instanceof EngineError) return error;
    
    let code = EngineErrorCode.UNKNOWN_ERROR;
    let remediation: string | undefined;

    if (error instanceof Error) {
      if (error.name === "SecurityError") {
        code = EngineErrorCode.SECURITY_ERROR;
        remediation = "Ensure COOP/COEP headers are correctly set for cross-origin isolation.";
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    return new EngineError({ code, message, engineId, originalError: error, remediation });
  }
}
