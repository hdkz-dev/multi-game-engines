/**
 * 2026 Zenith Tier: Backgammon Domain Implementation.
 */

import {
  Brand,
  Move,
  createMove,
  EngineError,
  EngineErrorCode,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
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
  // 2026 Best Practice: 制御文字（インジェクション試行）を早期に拒否
  if (/[\r\n\t\f\v\0]/.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Control characters detected in move string.",
      i18nKey: "errors.injection_detected",
    });
  }

  // 2026 Best Practice: バックギャモン記法のバリデーション
  // bar/24, 6/off, 24/18 などをサポート。厳密なスペース分離。
  const bgRegex = /^((?:bar|\d+)\/(?:off|\d+))( (?:bar|\d+)\/(?:off|\d+))*$/i;
  if (!bgRegex.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid backgammon move format: "${move}"`,
      i18nKey: "errors.invalid_backgammon_move",
    });
  }
  return createMove<"BackgammonMove">(move);
}

/**
 * 探索オプション。
 */
export interface IBackgammonSearchOptions extends IBaseSearchOptions {
  board: BackgammonBoard;
  dice: [number, number];
  cube?: number;
  matchLength?: number;
  [key: string]: unknown;
}

/**
 * 探索状況。
 */
export interface IBackgammonSearchInfo extends IBaseSearchInfo {
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
export interface IBackgammonSearchResult extends IBaseSearchResult {
  bestMove: BackgammonMove;
  equity: number;
  raw?: string | Record<string, unknown>;
  [key: string]: unknown;
}
