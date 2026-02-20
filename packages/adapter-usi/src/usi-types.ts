import { IBaseSearchOptions } from "@multi-game-engines/core";
import { SFEN } from "@multi-game-engines/domain-shogi";

/** 将棋用の探索オプション拡張 (標準規格) */
export interface ISHOGISearchOptions extends IBaseSearchOptions {
  sfen: SFEN;
  btime?: number;
  wtime?: number;
  byoyomi?: number;
  depth?: number;
  nodes?: number;
}
