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
  I18nKey,
} from "@multi-game-engines/core";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

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
    const i18nKey = "engine.errors.invalidBackgammonBoard" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  if (!board.every((v) => typeof v === "number" && Number.isFinite(v))) {
    const i18nKey = "engine.errors.invalidBackgammonBoard" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
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
    const i18nKey = "engine.errors.invalidBackgammonMove" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  // 2026 Best Practice: 制御文字（インジェクション試行）を早期に拒否
  if (/[\r\n\t\f\v\0]/.test(move)) {
    const i18nKey = "engine.errors.injectionDetected" as I18nKey;
    const i18nParams = { context: "Move", input: truncateLog(move) };
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }

  // 2026 Best Practice: バックギャモン記法のバリデーション
  // bar/24, 6/off, 24/18 などをサポート。厳密なスペース分離。
  const bgRegex = /^((?:bar|\d+)\/(?:off|\d+))( (?:bar|\d+)\/(?:off|\d+))*$/i;
  if (!bgRegex.test(move)) {
    const i18nKey = "engine.errors.invalidBackgammonMove" as I18nKey;
    const i18nParams = { move: truncateLog(move) };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
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
  cube?: number | undefined;
  matchLength?: number | undefined;
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
  depth?: number | undefined;
  nodes?: number | undefined;
  nps?: number | undefined;
  hashfull?: number | undefined;
  raw?: string | Record<string, unknown> | undefined;
  [key: string]: unknown;
}

/**
 * 探索結果。
 */
export interface IBackgammonSearchResult extends IBaseSearchResult {
  bestMove: BackgammonMove | null;
  equity: number;
  raw?: string | Record<string, unknown> | undefined;
  [key: string]: unknown;
}
