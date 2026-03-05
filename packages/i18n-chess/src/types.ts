import { I18nKey } from "@multi-game-engines/core";

/**
 * 2026 Zenith Tier: 再帰的な Record 型による Zero-Any ポリシーの遵守。
 */
export type DeepRecord = {
  [key: string]: string | number | boolean | DeepRecord | undefined;
};

/**
 * チェス固有キー (chess)
 */
export type ChessKey =
  | `pieces.${string}`
  | "errors.invalidFEN"
  | "errors.invalidFENStructure"
  | "errors.invalidFENTurn"
  | "errors.invalidFENEnPassant"
  | "errors.invalidFENCastling"
  | "errors.invalidFENHalfmove"
  | "errors.invalidFENFullmove"
  | "errors.invalidFenRanks"
  | "errors.invalidFenRow"
  | "errors.invalidFenChar"
  | "errors.invalidFenRankWidth"
  | "errors.missingFEN"
  | "parser.invalidPvMove"
  | "parser.invalidPonder";

/**
 * ブランド型との互換性を保つための型ヘルパー。
 */
export type ModularChessKey = (ChessKey | (string & I18nKey)) &
  (I18nKey | Record<string, never>);
