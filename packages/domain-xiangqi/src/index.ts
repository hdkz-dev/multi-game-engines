import { tCommon as translate } from "@multi-game-engines/i18n-common";
import {
  Brand,
  EngineError,
  EngineErrorCode,
  Move,
  createMove,
  createPositionString,
  PositionString,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IScoreInfo,
  createI18nKey,
  truncateLog,
} from "@multi-game-engines/core";

/**
 * Xiangqi Move (UCCI format: e2e4, h0g2, etc.).
 */
export type XiangqiMove = Brand<Move, "XiangqiMove">;

/**
 * Xiangqi FEN string.
 */
export type XFEN = PositionString<"XFEN">;

/**
 * Xiangqi search options.
 */
export interface IXiangqiSearchOptions extends IBaseSearchOptions {
  xfen?: XFEN | undefined;
  depth?: number | undefined;
}

/**
 * Xiangqi search info.
 */
export interface IXiangqiSearchInfo extends IBaseSearchInfo {
  score?: IScoreInfo | undefined;
  pv?: XiangqiMove[] | undefined;
}

/**
 * Xiangqi search result.
 */
export interface IXiangqiSearchResult extends IBaseSearchResult {
  bestMove: XiangqiMove | null;
  ponder?: XiangqiMove | undefined;
}

/**
 * Create a XiangqiMove with validation.
 * UCCI move format: [from_col][from_row][to_col][to_row] (e.g. "a0b1")
 */
export function createXiangqiMove(move: string): XiangqiMove {
  if (typeof move !== "string") {
    const i18nKey = createI18nKey("engine.errors.invalidMoveFormat");
    const i18nParams = { move: String(move) };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  // 制御文字インジェクションを早期拒否 (Refuse by Exception)
  if (/[\r\n\t\f\v\0]/.test(move)) {
    const i18nKey = createI18nKey("engine.errors.injectionDetected");
    const i18nParams = { context: "Move", input: truncateLog(move) };
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  // col: a-i, row: 0-9
  if (!/^[a-i][0-9][a-i][0-9]$|^resign$|^none$/.test(move)) {
    const i18nKey = createI18nKey("engine.errors.invalidMoveFormat");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, { move }),
      i18nKey,
    });
  }
  return createMove<"XiangqiMove">(move);
}

/**
 * Create an XFEN string with basic validation.
 */
export function createXFEN(pos: string): XFEN {
  if (typeof pos !== "string" || pos.trim() === "") {
    const i18nKey = createI18nKey("engine.errors.invalidPositionString");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  return createPositionString<"XFEN">(pos);
}
