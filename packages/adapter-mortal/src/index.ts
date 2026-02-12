import "@multi-game-engines/core";
import { IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult, Move } from "@multi-game-engines/core";

declare module "@multi-game-engines/core" {
  /** 麻雀の牌表記 (1m, 5p, 9s, nan, chun 等) */
  export type MahjongTile = string & { readonly __brand: "MahjongTile" };

  /** 麻雀の鳴き情報 */
  export interface IMahjongMeld {
    type: "chi" | "pon" | "kan" | "kankan";
    tiles: MahjongTile[];
    fromPlayer?: number;
  }

  /** 麻雀用の探索オプション拡張 */
  export interface IMahjongSearchOptions extends IBaseSearchOptions {
    hand: MahjongTile[];
    melds?: IMahjongMeld[];
    discards?: MahjongTile[][];
    dora?: MahjongTile[];
    playerWind?: number;
    prevalentWind?: number;
    isRiichi?: boolean[];
  }

  /** 麻雀用の思考情報拡張 */
  export interface IMahjongSearchInfo extends IBaseSearchInfo {
    evaluations?: Array<{
      move: Move;
      ev: number;
      prob?: number;
    }>;
  }

  interface EngineRegistry {
    mortal: { 
      options: IMahjongSearchOptions; 
      info: IMahjongSearchInfo; 
      result: IBaseSearchResult; 
    };
  }
}

export * from "./mortal.js";
export * from "./MahjongJSONParser.js";
