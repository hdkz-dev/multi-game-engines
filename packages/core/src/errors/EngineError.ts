import { EngineErrorCode, IEngineError } from "../types";

/**
 * プロジェクト全体で使用する標準エラークラス。
 */
export class EngineError extends Error implements IEngineError {
  constructor(
    public readonly code: EngineErrorCode,
    message: string,
    public readonly engineId?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "EngineError";
    
    /**
     * V8 などの対応環境でスタックトレースを正確に保持するために captureStackTrace を使用。
     * 標準の Error 型定義に含まれないため any を使用。
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((Error as any).captureStackTrace) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Error as any).captureStackTrace(this, EngineError);
    }
  }

  /**
   * 不明なエラーから EngineError を生成します。
   */
  static from(error: unknown, engineId?: string): EngineError {
    if (error instanceof EngineError) return error;
    
    const message = error instanceof Error ? error.message : String(error);
    return new EngineError(
      EngineErrorCode.UNKNOWN_ERROR,
      message,
      engineId,
      error
    );
  }
}
