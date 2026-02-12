import "@multi-game-engines/core";
import { IBaseSearchInfo, IBaseSearchResult } from "@multi-game-engines/core";
import { IChessSearchOptions } from "./UCIParser.js";

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    stockfish: { 
      options: IChessSearchOptions; 
      info: IBaseSearchInfo; 
      result: IBaseSearchResult; 
    };
  }
}

export * from "./stockfish.js";
export * from "./UCIParser.js";
