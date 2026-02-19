import "@multi-game-engines/core";
import {
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult,
} from "./EdaxParser.js";

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    edax: {
      options: IReversiSearchOptions;
      info: IReversiSearchInfo;
      result: IReversiSearchResult;
    };
  }
}

export * from "./edax.js";
export * from "./EdaxParser.js";
