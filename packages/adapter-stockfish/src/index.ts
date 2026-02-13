import "@multi-game-engines/core";
import { IChessSearchOptions, IChessSearchInfo, IChessSearchResult } from "./UCIParser.js";

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    stockfish: {
      options: IChessSearchOptions;
      info: IChessSearchInfo;
      result: IChessSearchResult;
    };
  }
}

export * from "./stockfish.js";
export * from "./UCIParser.js";
