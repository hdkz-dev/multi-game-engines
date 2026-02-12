import "@multi-game-engines/core";
import { ISHOGISearchInfo, ISHOGISearchResult } from "./USIParser.js";
import { ISHOGISearchOptions } from "./usi-types.js";

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    yaneuraou: { 
      options: ISHOGISearchOptions; 
      info: ISHOGISearchInfo; 
      result: ISHOGISearchResult; 
    };
  }
}

export * from "./yaneuraou.js";
export * from "./USIParser.js";
export * from "./usi-types.js";
