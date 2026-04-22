/**
 * 2026 Zenith Tier: Backgammon Domain Implementation.
 */

import { tCommon as translate } from "@multi-game-engines/i18n-common";
import {
  Brand,
  Move,
  createMove,
  EngineError,
  EngineErrorCode,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ProtocolValidator,
  truncateLog,
  createI18nKey,
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
    const i18nKey = createI18nKey("engine.errors.invalidBackgammonBoard");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  if (!board.every((v) => typeof v === "number" && Number.isInteger(v))) {
    const i18nKey = createI18nKey("engine.errors.invalidBackgammonBoard");
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
    const i18nKey = createI18nKey("engine.errors.invalidBackgammonMove");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  // 2026 Best Practice: ProtocolValidator で制御文字・セミコロン注入を一元拒否
  // (STRICT_REGEX: [\r\n\0;\x01-\x1f\x7f] — allowSemicolon=false がデフォルト)
  ProtocolValidator.assertNoInjection(move, "BackgammonMove");

  // 2026 Best Practice: バックギャモン記法のバリデーション
  // 有効なポイント範囲: 1–24。bar（バー）と off（ベアリングオフ）は特別トークン。
  // 例: "24/18", "bar/24", "6/off", "24/18 18/13", "6/1 6/1 6/1 6/1"
  const pt = "(?:bar|[1-9]|1[0-9]|2[0-4])";
  const dest = "(?:off|[1-9]|1[0-9]|2[0-4])";
  const bgRegex = new RegExp(`^(${pt}\\/${dest})( ${pt}\\/${dest})*$`, "i");
  if (!bgRegex.test(move)) {
    const i18nKey = createI18nKey("engine.errors.invalidBackgammonMove");
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
