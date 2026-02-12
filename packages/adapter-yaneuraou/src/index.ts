import "@multi-game-engines/core";
import { IBaseSearchInfo, IBaseSearchResult } from "@multi-game-engines/core";
import { ISHOGISearchOptions } from "./usi-types.js";

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
