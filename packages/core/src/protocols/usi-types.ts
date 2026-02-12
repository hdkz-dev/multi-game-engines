import { IBaseSearchOptions, SFEN } from "../types.js";

/** 将棋用の探索オプション拡張 (標準規格) */
export interface ISHOGISearchOptions extends IBaseSearchOptions {
  sfen: SFEN;
  btime?: number;
  wtime?: number;
  byoyomi?: number;
}
