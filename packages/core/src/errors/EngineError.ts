import { EngineErrorCode } from "../types.js";

/** エンジンエラーの構築オプション */
export interface IEngineErrorOptions {
  code: EngineErrorCode;
  message: string;
  engineId?: string | undefined;
  originalError?: unknown;
  /**
   * 解決策の提示 (開発者向けデバッグ情報)
   * 将来的にユーザーへ表示する場合は i18n キーへの置き換えを検討してください。
   */
  remediation?: string | undefined;
}

/**
 * エンジン操作中に発生する例外。
 */
export class EngineError extends Error {
  public readonly code: EngineErrorCode;
  public readonly engineId?: string | undefined;
  public readonly originalError?: unknown;
  public readonly remediation?: string | undefined;

  constructor(opts: IEngineErrorOptions) {
    super(opts.message);
    this.name = "EngineError";
    this.code = opts.code;
    this.engineId = opts.engineId;
    this.originalError = opts.originalError;
    this.remediation = opts.remediation;

    // 2026 Best Practice: クリーンなスタックトレースの確保 (V8 環境)
    const errorConstructor = Error as unknown as {
      captureStackTrace?: (target: object, constructor?: unknown) => void;
    };
    if (typeof errorConstructor.captureStackTrace === "function") {
      errorConstructor.captureStackTrace(this, EngineError);
    }
  }

  static from(error: unknown, engineId?: string): EngineError {
    if (error instanceof EngineError) {
      // engineId が指定されており、エラーにまだ ID がない場合は補完する
      if (engineId && !error.engineId) {
        return new EngineError({
          code: error.code,
          message: error.message,
          engineId,
          originalError: error.originalError,
          remediation: error.remediation,
        });
      }
      return error;
    }

    let code = EngineErrorCode.INTERNAL_ERROR;
    let remediation: string | undefined;

    if (error instanceof Error) {
      if (error.name === "SecurityError") {
        code = EngineErrorCode.SECURITY_ERROR;
        remediation =
          "Ensure COOP/COEP headers are correctly set for cross-origin isolation.";
      } else if (error instanceof TypeError) {
        remediation =
          "Check search options and engine configuration for invalid values.";
      } else if (error instanceof RangeError) {
        remediation =
          "Adjust search depth or parameters to be within allowed limits.";
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    return new EngineError({
      code,
      message,
      engineId,
      originalError: error,
      remediation,
    });
  }
}
