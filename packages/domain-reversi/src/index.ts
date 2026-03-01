import { tCommon as translate } from "@multi-game-engines/i18n-common";
import { Brand,
  EngineError,
  EngineErrorCode,
  ProtocolValidator,
  Move,
  createMove,
  createPositionString,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  createI18nKey } from "@multi-game-engines/core";

/** リバーシの盤面データ */
export type ReversiBoard = Brand<string, "ReversiBoard">;
/** リバーシの指し手 (a1-h8, PS 等) */
export type ReversiMove = Move<"ReversiMove">;

/**
 * リバーシの探索オプション。
 */
export interface IReversiSearchOptions extends IBaseSearchOptions {
  board: ReversiBoard;
  depth?: number | undefined;
  [key: string]: unknown;
}

/**
 * リバーシの探索状況。
 */
export interface IReversiSearchInfo extends IBaseSearchInfo {
  depth: number;
  [key: string]: unknown;
}

/**
 * リバーシの探索結果。
 */
export interface IReversiSearchResult extends IBaseSearchResult {
  bestMove: ReversiMove | null;
  [key: string]: unknown;
}

/**
 * リバーシ指し手形式 (a1-h8, PS (Pass) 等) を検証する正規表現。
 */
export const REVERSI_MOVE_REGEX = /^([a-h][1-8]|PS)$/i;

/**
 * 文字列を ReversiMove へ変換し、厳密に検証します。
 */
export function createReversiMove(move: string): ReversiMove {
  if (typeof move !== "string" || move.trim().length === 0) {
    const i18nKey = createI18nKey("engine.errors.invalidReversiMove");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(move, "ReversiMove");
  if (!REVERSI_MOVE_REGEX.test(move)) {
    const i18nKey = createI18nKey("engine.errors.invalidReversiMove");
    const i18nParams = { move };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return createMove<"ReversiMove">(move);
}

/**
 * リバーシ盤面データのバリデータ。
 */
export function createReversiBoard(pos: string): ReversiBoard {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    const i18nKey = createI18nKey("engine.errors.invalidReversiBoard");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(pos, "ReversiBoard");
  return createPositionString<"ReversiBoard">(pos);
}
