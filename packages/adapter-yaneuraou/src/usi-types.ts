import { IBaseSearchOptions, Brand } from "@multi-game-engines/core";

/** 将棋用の局面表記 (Shogi Forsyth-Edwards Notation) */
export type SFEN = Brand<string, "SFEN">;

/**
 * SFEN 文字列のバリデータファクトリ。
 * `createFEN()` (core) と同じパターン。
 */
export function createSFEN(sfen: string): SFEN {
  if (typeof sfen !== "string" || sfen.trim().length === 0) {
    throw new Error("Invalid SFEN: Input must be a non-empty string.");
  }
  return sfen as SFEN;
}

/** 将棋用の指し手表記 (7g7f等) */
export type Move = Brand<string, "Move">;

/** 将棋用の探索オプション拡張 (標準規格) */
export interface ISHOGISearchOptions extends IBaseSearchOptions {
  sfen: SFEN;
  btime?: number;
  wtime?: number;
  byoyomi?: number;
  depth?: number;
  nodes?: number;
}
