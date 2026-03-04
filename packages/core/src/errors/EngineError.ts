import { EngineErrorCode, IEngineError, I18nKey } from "../types.js";

/**
 * V8 エンジンの Error コンストラクタ定義。
 */
interface V8ErrorConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  captureStackTrace?: (target: object, ctor?: any) => void;
}

/**
 * 2026 Zenith Tier: プロジェクト全体の統一例外クラス。
 */
export class EngineError extends Error implements IEngineError {
  public readonly code: EngineErrorCode;
  public readonly engineId?: string | undefined;
  public readonly originalError?: unknown | undefined;
  public readonly remediation?: string | undefined;
  public readonly i18nKey?: I18nKey | undefined;
  public readonly i18nParams?: Record<string, string | number> | undefined;

  constructor(params: IEngineError | string) {
    if (typeof params === "string") {
      super(params);
      this.code = EngineErrorCode.UNKNOWN_ERROR;
    } else {
      super(params.message);
      this.code = params.code;
      this.engineId = params.engineId;
      this.originalError = params.originalError;
      this.remediation = params.remediation;
      this.i18nKey = params.i18nKey;
      this.i18nParams = params.i18nParams;
    }

    this.name = "EngineError";

    const v8Error = Error as unknown as V8ErrorConstructor;
    v8Error.captureStackTrace?.(this, EngineError);
  }

  /**
   * 任意の例外を EngineError に変換します。
   */
  static from(err: unknown, engineId?: string): EngineError {
    if (err instanceof EngineError) {
      return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    return new EngineError({
      code: EngineErrorCode.UNKNOWN_ERROR,
      message,
      engineId,
      originalError: err,
    });
  }
}
