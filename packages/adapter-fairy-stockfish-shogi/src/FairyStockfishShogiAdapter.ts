import { IEngineConfig, IEngine, deepMerge } from "@multi-game-engines/core";
import { USIAdapter } from "@multi-game-engines/adapter-usi";
import {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/domain-shogi";

export class FairyStockfishShogiAdapter extends USIAdapter {
  constructor(config?: Partial<IEngineConfig>) {
    const defaultConfig: IEngineConfig = {
      id: "fairy-stockfish-shogi",
      adapter: "usi",
      name: "Fairy-Stockfish Shogi",
      version: "1.1.11",
    };
    super(deepMerge(defaultConfig, config));
  }
}

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    "fairy-stockfish-shogi": IEngine<
      IShogiSearchOptions,
      IShogiSearchInfo,
      IShogiSearchResult
    >;
  }
}
