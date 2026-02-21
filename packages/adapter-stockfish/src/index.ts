import { StockfishAdapter } from "./stockfish.js";
import { IEngine, IEngineConfig, EngineFacade } from "@multi-game-engines/core";
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
  const adapter = new StockfishAdapter(config);
  return new EngineFacade(adapter);
}

export * from "@multi-game-engines/adapter-uci";
