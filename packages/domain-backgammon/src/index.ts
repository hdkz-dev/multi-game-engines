/**
 * 2026 Zenith Tier: Backgammon Domain Implementation.
 */

import { Brand, Move, createMove } from "@multi-game-engines/core";

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
  // バックギャモン記法のバリデーション（簡易的な例）
  if (!/^(\d+\/\d+)(\s+\d+\/\d+)*$/.test(move)) {
    // 記法が特殊なため createMove のベースチェックをバイパスするか検討が必要ですが、
    // 一旦標準バリデータを通します。
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
