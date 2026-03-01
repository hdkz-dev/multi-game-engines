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
  I18nKey,
} from "@multi-game-engines/core";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * Janggi Move.
 */
export type JanggiMove = Brand<Move, "JanggiMove">;

/**
 * Janggi Position string.
 */
export type JanggiPosition = PositionString<"JanggiPosition">;

/**
 * Janggi search options.
 */
export interface IJanggiSearchOptions extends IBaseSearchOptions {
  position?: JanggiPosition | undefined;
}

/**
 * Janggi search info.
 */
export interface IJanggiSearchInfo extends IBaseSearchInfo {
  score?: IScoreInfo | undefined;
}

/**
 * Janggi search result.
 */
export interface IJanggiSearchResult extends IBaseSearchResult {
  bestMove: JanggiMove | null;
}

/**
 * Create a JanggiMove with validation.
 */
export function createJanggiMove(move: string): JanggiMove {
  // Basic validation for Janggi move
  if (!/^[a-i][0-9][a-i][0-9]$|^resign$|^pass$/.test(move)) {
    const i18nKey = "engine.errors.invalidMoveFormat" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, { move }),
      i18nKey,
    });
  }
  return createMove<"JanggiMove">(move);
}

/**
 * Create a JanggiPosition string.
 */
export function createJanggiPosition(pos: string): JanggiPosition {
  if (typeof pos !== "string" || pos.trim() === "") {
    const i18nKey = "engine.errors.invalidPositionString" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  return createPositionString<"JanggiPosition">(pos);
}
