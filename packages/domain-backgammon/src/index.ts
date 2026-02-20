/**
 * 2026 Zenith Tier: Backgammon Domain Implementation.
 */

import {
  Brand,
  Move,
  createMove,
  EngineError,
  EngineErrorCode,
} from "@multi-game-engines/core";

/**
 * バックギャモンの盤面表現。
 * 26要素の配列（0: 白バー, 1-24: ポイント, 25: 黒バー）。
 */
export type BackgammonBoard = Brand<number[], "BackgammonBoard">;

/**
 * バックギャモンの指し手表現（例: "24/18 18/13"）。
 */
export type BackgammonMove = Move<"BackgammonMove">;

/**
 * バックギャモン指し手バリデータファクトリ。
 */
export function createBackgammonMove(move: string): BackgammonMove {
  // 2026 Best Practice: バックギャモン記法のバリデーション
  // bar/24, 6/off, 24/18 などをサポート
  const bgRegex = /^((bar|\d+)\/(off|\d+))(\s+(bar|\d+)\/(off|\d+))*$/i;
  if (!bgRegex.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid backgammon move format: "${move}"`,
    });
  }
  return createMove<"BackgammonMove">(move);
}

/**
 * 探索オプション。
 */
export interface IBackgammonSearchOptions {
  board: BackgammonBoard;
  dice: [number, number];
  cube?: number;
  matchLength?: number;
  [key: string]: unknown;
}

/**
 * 探索状況。
 */
export interface IBackgammonSearchInfo {
  equity: number;
  winProbability: number;
  winGammonProbability: number;
  winBackgammonProbability: number;
  depth?: number;
  nodes?: number;
  nps?: number;
  hashfull?: number;
  raw?: string | Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 探索結果。
 */
export interface IBackgammonSearchResult {
  bestMove: BackgammonMove;
  equity: number;
  raw?: string | Record<string, unknown>;
  [key: string]: unknown;
}
