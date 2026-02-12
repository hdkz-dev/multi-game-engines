import "@multi-game-engines/core";
import { IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult, Move } from "@multi-game-engines/core";

declare module "@multi-game-engines/core" {
  /** 囲碁用の局面表記 (Smart Game Format) */
  export type SGF = string & { readonly __brand: "SGF" };

  /** 囲碁エンジン用の探索オプション */
  export interface IGOSearchOptions extends IBaseSearchOptions {
    sgf?: SGF;
    btime?: number;
    wtime?: number;
    byoyomi?: number;
    maxVisits?: number;
  }

  /** 囲碁エンジンからの思考情報 */
  export interface IGOSearchInfo extends IBaseSearchInfo {
    winrate?: number;
    visits?: number;
    ownerMap?: number[];
  }

  interface EngineRegistry {
    katago: { 
      options: IGOSearchOptions; 
      info: IGOSearchInfo; 
      result: IBaseSearchResult; 
    };
  }
}

export * from "./katago.js";
export * from "./GTPParser.js";
