import {
  EngineError,
  EngineErrorCode,
  ProtocolValidator,
  Move,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  I18nKey,
} from "@multi-game-engines/core";
import { t as translate } from "@multi-game-engines/i18n";

/** 麻雀の指し手（打牌、副露等） */
export type MahjongMove = Move<"MahjongMove">;

/**
 * 麻雀の探索オプション。
 */
export interface IMahjongSearchOptions extends IBaseSearchOptions {
  board: Record<string, unknown> | unknown[];
  [key: string]: unknown;
}

/**
 * 麻雀の探索状況。
 */
export interface IMahjongSearchInfo extends IBaseSearchInfo {
  raw: string;
  thinking: string;
  evaluations?:
    | {
        move: MahjongMove;
        ev: number;
        prob?: number | undefined;
      }[]
    | undefined;
  [key: string]: unknown;
}

/**
 * 麻雀の探索結果。
 */
export interface IMahjongSearchResult extends IBaseSearchResult {
  raw: string;
  bestMove: MahjongMove | null;
  [key: string]: unknown;
}

/**
 * 麻雀の指し手形式（例: 1m, tsumo, riichi 等）を検証する正規表現。
 */
export const MAHJONG_MOVE_REGEX =
  /^([1-9][mpsz]|tsumo|ron|riichi|chi|pon|kan|kakan|nuki|none)$/;

/**
 * 文字列を MahjongMove へ変換し、厳密に検証します。
 */
export function createMahjongMove(move: string): MahjongMove {
  if (typeof move !== "string" || move.trim().length === 0) {
    const i18nKey = "engine.errors.invalidMahjongMove" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(move, "MahjongMove");
  if (!MAHJONG_MOVE_REGEX.test(move)) {
    const i18nKey = "engine.errors.invalidMahjongMove" as I18nKey;
    const i18nParams = { move };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }
  return move as MahjongMove;
}

/**
 * 麻雀盤面データ（JSON構造）のバリデータ。
 */
export function validateMahjongBoard(board: unknown): void {
  const MAX_DEPTH = 10;
  const validateValue = (
    value: unknown,
    path: string = "board",
    depth: number = 0,
  ): void => {
    if (depth > MAX_DEPTH) {
      const i18nKey = "engine.errors.nestedTooDeep" as I18nKey;
      const i18nParams = { path };
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: translate(i18nKey, i18nParams),
        i18nKey,
        i18nParams,
      });
    }
    if (typeof value === "string") {
      ProtocolValidator.assertNoInjection(
        value,
        `mahjong board data: ${path}`,
        true,
      );
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        validateValue(v, `${path}[${i}]`, depth + 1);
      });
      return;
    }
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        validateValue(v, `${path}.${k}`, depth + 1);
      }
    }
  };
  validateValue(board);
}
