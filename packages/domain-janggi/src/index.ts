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
  // eslint-disable-next-line no-control-regex
  if (/[\r\n\0\x01-\x1f\x7f]/.test(move)) {
    const i18nKey = createI18nKey("engine.errors.injectionDetected");
    const i18nParams = { context: "Move", input: truncateLog(move) };
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  if (!/^[a-i][0-9][a-i][0-9]$|^resign$|^pass$/.test(move)) {
    const i18nKey = createI18nKey("engine.errors.invalidMoveFormat");
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
    const i18nKey = createI18nKey("engine.errors.invalidPositionString");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  return createPositionString<"JanggiPosition">(pos);
}
