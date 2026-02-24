/**
 * 2026 Zenith Tier: Checkers Domain Implementation.
 */

import {
  Brand,
  Move,
  createMove,
  createPositionString,
  ProtocolValidator,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineError,
  EngineErrorCode,
  I18nKey,
} from "@multi-game-engines/core";
import { t as translate } from "@multi-game-engines/i18n";

/**
 * チェッカーの盤面表現。
 */
export type CheckersBoard = Brand<string, "CheckersBoard">;

/**
 * チェッカー盤面データのバリデータファクトリ。
 * @throws {Error} インジェクション攻撃が検出された場合
 */
export function createCheckersBoard(pos: string): CheckersBoard {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    const i18nKey = "engine.errors.invalidCheckersBoard" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(pos, "CheckersBoard", true);
  return createPositionString<"CheckersBoard">(pos);
}

/**
 * チェッカーの指し手表現（例: "11-15"）。
 */
export type CheckersMove = Move<"CheckersMove">;

/**
 * チェッカー指し手バリデータファクトリ。
 */
export function createCheckersMove(move: string): CheckersMove {
  if (typeof move !== "string" || move.trim().length === 0) {
    const i18nKey = "engine.errors.invalidCheckersMove" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(move, "CheckersMove");
  if (!/^\d+-\d+$/.test(move) && move !== "(none)") {
    const i18nKey = "engine.errors.invalidCheckersMove" as I18nKey;
    const i18nParams = { move };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return createMove<"CheckersMove">(move);
}

/**
 * 探索オプション。
 */
export interface ICheckersSearchOptions extends IBaseSearchOptions {
  board: CheckersBoard;
  variant?: "english" | "brazilian" | "pool" | undefined;
  [key: string]: unknown;
}

/**
 * 探索状況。
 */
export interface ICheckersSearchInfo extends IBaseSearchInfo {
  eval?: number | undefined;
  depth?: number | undefined;
  pv?: CheckersMove[] | undefined;
  nodes?: number | undefined;
  nps?: number | undefined;
  hashfull?: number | undefined;
  raw?: string | Record<string, unknown> | undefined;
  [key: string]: unknown;
}

/**
 * 探索結果。
 */
export interface ICheckersSearchResult extends IBaseSearchResult {
  bestMove: CheckersMove | null;
  eval?: number | undefined;
  raw?: string | Record<string, unknown> | undefined;
  [key: string]: unknown;
}
