import {
  Brand,
  EngineError,
  EngineErrorCode,
  Move,
  createMove,
  createPositionString,
  ProtocolValidator,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  I18nKey,
} from "@multi-game-engines/core";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/** 囲碁の盤面データ */
export type GOBoard = Brand<string, "GOBoard">;
/** 囲碁の 指し手 (GTP形式: A1-Z25 (skip I), pass, resign) */
export type GOMove = Move<"GOMove">;

/**
 * 囲碁の探索オプション。
 */
export interface IGoSearchOptions extends IBaseSearchOptions {
  size?: number | undefined;
  komi?: number | undefined;
  /** 盤面データ (SGF等) */
  board?: string | undefined;
  /** KataGo 分析インターバル (ms) */
  kataInterval?: number | undefined;
  [key: string]: unknown;
}

/**
 * 囲碁の探索状況。
 */
export interface IGoSearchInfo extends IBaseSearchInfo {
  winrate?: number | undefined;
  visits?: number | undefined;
  scoreLead?: number | undefined;
  pv?: GOMove[] | undefined;
  /** ヒートマップ（各点の支配率/重要度） */
  ownerMap?: number[] | undefined;
  [key: string]: unknown;
}

/**
 * 囲碁の探索結果。
 */
export interface IGoSearchResult extends IBaseSearchResult {
  bestMove: GOMove | null;
  [key: string]: unknown;
}

/**
 * 囲碁盤面データのバリデータファクトリ。
 */
export function createGOBoard(pos: string): GOBoard {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    const i18nKey = "engine.errors.invalidGOBoard" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(pos, "GOBoard");
  if (!/^[a-zA-Z0-9.\- ]+$/.test(pos)) {
    const i18nKey = "engine.errors.illegalCharacters" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  return createPositionString<"GOBoard">(pos) as GOBoard;
}

/**
 * 囲碁指し手のバリデータファクトリ。
 */
export function createGOMove(move: string): GOMove {
  if (typeof move !== "string" || move.trim().length === 0) {
    const i18nKey = "engine.errors.invalidGOMove" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(move, "GOMove");
  // 2026 Best Practice: 正規化（小文字化）をバリデータ層で実施
  const normalized = move.toLowerCase();
  if (!/^[a-z0-9]+$/.test(normalized)) {
    const i18nKey = "engine.errors.illegalCharacters" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  if (!/^([a-hj-z]([1-9]|1[0-9]|2[0-5])|pass|resign)$/.test(normalized)) {
    const i18nKey = "engine.errors.invalidGOMove" as I18nKey;
    const i18nParams = { move };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return createMove<"GOMove">(normalized);
}
