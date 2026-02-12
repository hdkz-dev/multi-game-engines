import "@multi-game-engines/core";
import { ISHOGISearchOptions, IBaseSearchInfo, IBaseSearchResult } from "@multi-game-engines/core";

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    yaneuraou: { 
      options: ISHOGISearchOptions; 
      info: IBaseSearchInfo; 
      result: IBaseSearchResult; 
    };
  }
}

export * from "./yaneuraou.js";
