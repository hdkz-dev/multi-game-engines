import { StockfishAdapter } from "./stockfish.js";
import { IEngine, IEngineConfig } from "@multi-game-engines/core";
import {
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "@multi-game-engines/adapter-uci";

export { StockfishAdapter };

/**
 * Stockfish エンジンのインスタンスを生成します。
 */
export function createStockfishEngine(
  config: IEngineConfig = {},
): IEngine<IChessSearchOptions, IChessSearchInfo, IChessSearchResult> {
  return new StockfishAdapter(config) as unknown as IEngine<
    IChessSearchOptions,
    IChessSearchInfo,
    IChessSearchResult
  >;
}

export * from "@multi-game-engines/adapter-uci";
