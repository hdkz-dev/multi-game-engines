import { IBaseSearchOptions, SFEN, Move } from "@multi-game-engines/core";
export { createSFEN } from "@multi-game-engines/core";
export type { SFEN, Move };

/** 将棋用の探索オプション拡張 (標準規格) */
export interface ISHOGISearchOptions extends IBaseSearchOptions {
  sfen: SFEN;
  btime?: number;
  wtime?: number;
  byoyomi?: number;
  depth?: number;
  nodes?: number;
}
