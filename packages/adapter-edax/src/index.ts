import "@multi-game-engines/core";
import { IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult, Move } from "@multi-game-engines/core";

declare module "@multi-game-engines/core" {
  /** オセロ用の局面表記 (64文字文字列等) */
  export type OthelloBoard = string & { readonly __brand: "OthelloBoard" };

  /** オセロ用の探索オプション拡張 */
  export interface IOthelloSearchOptions extends IBaseSearchOptions {
    board?: OthelloBoard;
    isBlack?: boolean;
  }

  /** オセロ用の思考情報拡張 */
  export interface IOthelloSearchInfo extends IBaseSearchInfo {
    isExact?: boolean;
  }

  interface EngineRegistry {
    edax: { 
      options: IOthelloSearchOptions; 
      info: IOthelloSearchInfo; 
      result: IBaseSearchResult; 
    };
  }
}

export * from "./edax.js";
export * from "./EdaxParser.js";
