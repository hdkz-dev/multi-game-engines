import "@multi-game-engines/core";
import { IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult } from "@multi-game-engines/core";

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    stockfish: { 
      options: IBaseSearchOptions; 
      info: IBaseSearchInfo; 
      result: IBaseSearchResult; 
    };
  }
}

export * from "./stockfish.js";
