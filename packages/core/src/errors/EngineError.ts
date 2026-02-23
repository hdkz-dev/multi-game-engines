import { EngineErrorCode } from "../types.js";

/**
 * 許可された i18n キーのリスト。
 * 注意: i18n パッケージとの完全同期は保証できないため、主要なキーのみを列挙し、
 * その他は `string` (テンプレートリテラル型による緩和) を許容する。
 */
export type ValidI18nKey =
  | "engine.errors.initializationFailed"
  | "engine.errors.workerError"
  | "engine.errors.timeout"
  | "engine.errors.disposed"
  | "engine.errors.sriMismatch"
  | "engine.errors.invalidEngineId"
  | "engine.errors.insecureConnection"
  | "engine.errors.sriRequired"
  | "engine.errors.invalidFEN"
  | "engine.errors.invalidSFEN"
  | "engine.errors.invalidMoveFormat"
  | "engine.errors.injectionDetected"
  | "engine.errors.bridgeDisposed"
  | "engine.errors.illegalCharacters"
  | "engine.errors.invalidFENStructure"
  | "engine.errors.invalidFENTurn"
  | "engine.errors.invalidFENEnPassant"
  | "engine.errors.invalidFENCastling"
  | "engine.errors.invalidFENHalfmove"
  | "engine.errors.invalidFENFullmove"
  | "engine.errors.invalidSFENStructure"
  | "engine.errors.invalidSFENTurn"
  | "engine.errors.invalidSFENHand"
  | "engine.errors.invalidSFENMoveCounter"
  | "engine.errors.invalidFenRanks"
  | "engine.errors.invalidFenRow"
  | "engine.errors.invalidFenChar"
  | "engine.errors.invalidFenRankWidth"
  | "engine.errors.invalidSfenRanks"
  | "engine.errors.invalidSfenPiece"
  | "engine.errors.invalidSfenChar"
  | "engine.errors.invalidSfenRankWidth"
  | "engine.errors.invalidShogiMove"
  | "engine.errors.invalidMahjongMove"
  | "engine.errors.invalidGOBoard"
  | "engine.errors.invalidGOMove"
  | "engine.errors.invalidReversiBoard"
  | "engine.errors.invalidReversiMove"
  | "engine.errors.invalidBackgammonBoard"
  | "engine.errors.invalidBackgammonMove"
  | "engine.errors.invalidCheckersBoard"
  | "engine.errors.invalidCheckersMove"
  | "engine.errors.adapterFactoryInvalidReturn"
  | "engine.errors.adapterNotFound"
  | "engine.errors.resourceLoadUnknown"
  | "adapters.uci.errors.missingFEN"
  | "adapters.usi.errors.missingFEN"
  | "adapters.gtp.errors.invalidResponse"
  | "adapters.ensemble.errors.noResults"
  | (string & {});

/** エンジンエラーの構築オプション */
export interface IEngineErrorOptions {
  code: EngineErrorCode;
  message: string;
  engineId?: string | undefined;
  originalError?: unknown;
  /**
   * 解決策の提示 (開発者向けデバッグ情報)
   */
  remediation?: string | undefined;
  /** 国際化対応のためのメッセージキー */
  i18nKey?: ValidI18nKey | undefined;
  /** メッセージの埋め込みパラメータ */
  i18nParams?: Record<string, string | number> | undefined;
}

/**
 * エンジン操作中に発生する例外。
 */
export class EngineError extends Error {
  public readonly code: EngineErrorCode;
  public readonly engineId?: string | undefined;
  public readonly originalError?: unknown;
  public readonly remediation?: string | undefined;
  public readonly i18nKey?: ValidI18nKey | undefined;
  public readonly i18nParams?: Record<string, string | number> | undefined;

  constructor(opts: IEngineErrorOptions) {
    // 2026 Best Practice: Error Cause API の活用
    super(opts.message, { cause: opts.originalError });
    this.name = "EngineError";
    this.code = opts.code;
    this.engineId = opts.engineId;
    this.originalError = opts.originalError;
    this.remediation = opts.remediation;
    this.i18nKey = opts.i18nKey;
    this.i18nParams = opts.i18nParams;

    // 2026 Best Practice: クリーンなスタックトレースの確保 (V8 環境)
    if (
      typeof (Error as { captureStackTrace?: unknown }).captureStackTrace ===
      "function"
    ) {
      (
        Error as { captureStackTrace: (t: object, c?: unknown) => void }
      ).captureStackTrace(this, EngineError);
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
          i18nKey: error.i18nKey,
          i18nParams: error.i18nParams,
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
