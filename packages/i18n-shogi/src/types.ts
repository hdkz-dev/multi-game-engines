import { I18nKey } from "@multi-game-engines/core";

/**
 * 2026 Zenith Tier: 再帰的な Record 型による Zero-Any ポリシーの遵守。
 */
export type DeepRecord = {
  [key: string]: string | number | boolean | DeepRecord | undefined;
};

export interface ShogiLocale {
  engine: {
    title: string;
    status: string;
    depth: string;
    nodes: string;
    nps: string;
    time: string;
    score: string;
    visits: string;
    mateIn: string;
    advantage: string;
    sideSente: string;
    sideGote: string;
  };
  gameBoard: {
    title: string;
    handSente: string;
    handGote: string;
    handPieceCount: string;
    shogiPieces: Record<string, string>;
  };
  board: {
    senteHand: string;
    goteHand: string;
    lastMove: string;
    initialPosition: string;
  };
  errors: {
    missingSFEN: string;
    invalidSFEN: string;
  };
}

/**
 * 将棋固有キー (shogi)
 */
export type ShogiKey =
  | `pieces.${string}`
  | "errors.invalidSFEN"
  | "errors.invalidSFENStructure"
  | "errors.invalidSFENTurn"
  | "errors.invalidSFENHand"
  | "errors.invalidSFENMoveCounter"
  | "errors.invalidSfenRanks"
  | "errors.invalidSfenPiece"
  | "errors.invalidSfenChar"
  | "errors.invalidSfenRankWidth"
  | "errors.missingFEN"
  | "parser.invalidCurrMove"
  | "parser.invalidPvMove"
  | "parser.invalidPonder";

/**
 * ブランド型との互換性を保つための型ヘルパー。
 */
export type ModularShogiKey = (ShogiKey | (string & I18nKey)) &
  (I18nKey | Record<string, never>);
