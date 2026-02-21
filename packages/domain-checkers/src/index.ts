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
  // 2026 Best Practice: 局面データに対するインジェクション対策を徹底
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
  if (!/^\d+-\d+$/.test(move) && move !== "(none)") {
    throw new Error(`Invalid CheckersMove format: "${move}"`);
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
