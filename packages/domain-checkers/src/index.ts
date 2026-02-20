/**
 * 2026 Zenith Tier: Checkers Domain Implementation.
 */

import {
  Brand,
  Move,
  createMove,
  createPositionString,
} from "@multi-game-engines/core";

/**
 * チェッカーの盤面表現。
 */
export type CheckersBoard = Brand<string, "CheckersBoard">;

/**
 * チェッカー盤面データのバリデータファクトリ。
 */
export function createCheckersBoard(pos: string): CheckersBoard {
  return createPositionString<"CheckersBoard">(pos) as CheckersBoard;
}

/**
 * チェッカーの指し手表現（例: "11-15"）。
 */
export type CheckersMove = Move<"CheckersMove">;

/**
 * チェッカー指し手バリデータファクトリ。
 */
export function createCheckersMove(move: string): CheckersMove {
  return createMove<"CheckersMove">(move);
}

/**
 * 探索オプション。
 */
export interface ICheckersSearchOptions {
  board: CheckersBoard;
  variant?: "english" | "brazilian" | "pool";
  [key: string]: unknown;
}

/**
 * 探索状況。
 */
export interface ICheckersSearchInfo {
  eval: number;
  depth: number;
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
export interface ICheckersSearchResult {
  bestMove: CheckersMove;
  eval: number;
  raw?: string | Record<string, unknown>;
  [key: string]: unknown;
}
