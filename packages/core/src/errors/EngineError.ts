import { EngineErrorCode } from "../types";

/**
 * ライブラリ内で発生する全てのエラーを統括するクラス。
 * 
 * 標準の Error クラスを拡張し、エンジンの識別子やエラーコード、
 * 原因となった元の例外を保持します。
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

    // V8 環境でのスタックトレースの保存
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (Error as any).captureStackTrace === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Error as any).captureStackTrace(this, EngineError);
    }
  }

  /**
   * 任意の例外を EngineError へ変換（ラップ）します。
   */
  static from(error: unknown, engineId?: string): EngineError {
    if (error instanceof EngineError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new EngineError(EngineErrorCode.UNKNOWN_ERROR, message, engineId, error);
  }
}
