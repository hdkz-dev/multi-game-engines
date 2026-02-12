import "@multi-game-engines/core";
import { IGOSearchOptions, IGOSearchInfo, IGOSearchResult } from "./GTPParser.js";

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    katago: { 
      options: IGOSearchOptions; 
      info: IGOSearchInfo; 
      result: IGOSearchResult; 
    };
  }
}

export * from "./katago.js";
export * from "./GTPParser.js";
