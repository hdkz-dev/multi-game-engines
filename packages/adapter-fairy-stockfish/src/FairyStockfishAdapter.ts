import { IEngineConfig, IEngine, deepMerge } from "@multi-game-engines/core";
import { UCIAdapter } from "@multi-game-engines/adapter-uci";
import {
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "@multi-game-engines/domain-chess";

export class FairyStockfishAdapter extends UCIAdapter {
  constructor(config?: Partial<IEngineConfig>) {
    const defaultConfig: IEngineConfig = {
      id: "fairy-stockfish",
      adapter: "uci",
      name: "Fairy-Stockfish",
      version: "1.1.11",
    };
    super(deepMerge(defaultConfig, config));
  }
}

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    "fairy-stockfish": IEngine<
      IChessSearchOptions,
      IChessSearchInfo,
      IChessSearchResult
    >;
  }
}
