import "@multi-game-engines/core";
import {
  IOthelloSearchOptions,
  IOthelloSearchInfo,
  IOthelloSearchResult,
} from "./EdaxParser.js";

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    edax: {
      options: IOthelloSearchOptions;
      info: IOthelloSearchInfo;
      result: IOthelloSearchResult;
    };
  }
}

export * from "./edax.js";
export * from "./EdaxParser.js";
