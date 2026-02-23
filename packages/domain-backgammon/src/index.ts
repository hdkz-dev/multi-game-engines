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
  truncateLog,
} from "@multi-game-engines/core";

/**
 * バックギャモンの盤面表現。
 * 26要素の配列（0: 白バー, 1-24: ポイント, 25: 黒バー）。
 */
export type BackgammonBoard = Brand<number[], "BackgammonBoard">;

/**
 * バックギャモン盤面バリデータファクトリ。
 */
export function createBackgammonBoard(board: unknown): BackgammonBoard {
  if (!Array.isArray(board) || board.length !== 26) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message:
        "Invalid BackgammonBoard: Must be an array of exactly 26 numbers.",
      i18nKey: "engine.errors.invalidBackgammonBoard",
    });
  }
  if (!board.every((v) => typeof v === "number" && Number.isFinite(v))) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid BackgammonBoard: All elements must be finite numbers.",
      i18nKey: "engine.errors.invalidBackgammonBoard",
    });
  }
  return board as BackgammonBoard;
}

/**
 * バックギャモンの指し手表現（例: "24/18 18/13"）。
 */
export type BackgammonMove = Move<"BackgammonMove">;

/**
 * バックギャモン指し手バリデータファクトリ。
 */
export function createBackgammonMove(move: string): BackgammonMove {
  if (typeof move !== "string" || move.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid BackgammonMove: Input must be a non-empty string.",
      i18nKey: "engine.errors.invalidBackgammonMove",
    });
  }
  // 2026 Best Practice: 制御文字（インジェクション試行）を早期に拒否
  if (/[\r\n\t\f\v\0]/.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Control characters detected in move string.",
      i18nKey: "engine.errors.injectionDetected",
      i18nParams: { context: "Move", input: truncateLog(move) },
    });
  }

  // 2026 Best Practice: バックギャモン記法のバリデーション
  // bar/24, 6/off, 24/18 などをサポート。厳密なスペース分離。
  const bgRegex = /^((?:bar|\d+)\/(?:off|\d+))( (?:bar|\d+)\/(?:off|\d+))*$/i;
  if (!bgRegex.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid backgammon move format: "${truncateLog(move)}"`,
      i18nKey: "engine.errors.invalidBackgammonMove",
      i18nParams: { move: truncateLog(move) },
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
  bestMove: BackgammonMove | null;
  equity: number;
  raw?: string | Record<string, unknown>;
  [key: string]: unknown;
}
