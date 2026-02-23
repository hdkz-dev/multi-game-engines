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
} from "@multi-game-engines/core";

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
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid CheckersBoard: Input must be a non-empty string.",
      i18nKey: "engine.errors.invalidCheckersBoard",
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
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid CheckersMove: Input must be a non-empty string.",
      i18nKey: "engine.errors.invalidCheckersMove",
    });
  }
  ProtocolValidator.assertNoInjection(move, "CheckersMove");
  if (!/^\d+-\d+$/.test(move) && move !== "(none)") {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid CheckersMove format: "${move}"`,
      i18nKey: "engine.errors.invalidCheckersMove",
      i18nParams: { move },
    });
  }
  return createMove<"CheckersMove">(move);
}

/**
 * 探索オプション。
 */
export interface ICheckersSearchOptions extends IBaseSearchOptions {
  board: CheckersBoard;
  variant?: "english" | "brazilian" | "pool";
  [key: string]: unknown;
}

/**
 * 探索状況。
 */
export interface ICheckersSearchInfo extends IBaseSearchInfo {
  eval?: number;
  depth?: number;
  pv?: CheckersMove[];
  nodes?: number;
  nps?: number;
  hashfull?: number;
  raw?: string | Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 探索結果。
 */
export interface ICheckersSearchResult extends IBaseSearchResult {
  bestMove: CheckersMove | null;
  eval?: number;
  raw?: string | Record<string, unknown>;
  [key: string]: unknown;
}
