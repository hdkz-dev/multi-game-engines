import "@multi-game-engines/core";
import {
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult,
} from "./MahjongJSONParser.js";

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    mortal: {
      options: IMahjongSearchOptions;
      info: IMahjongSearchInfo;
      result: IMahjongSearchResult;
    };
  }
}

export * from "./mortal.js";
export * from "./MahjongJSONParser.js";
