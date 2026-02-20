import { EdaxAdapter } from "./edax.js";
import { IEngine, IEngineConfig } from "@multi-game-engines/core";
import {
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult,
} from "./EdaxParser.js";

export { EdaxAdapter };
export { EdaxParser } from "./EdaxParser.js";
export { IReversiSearchOptions, IReversiSearchInfo, IReversiSearchResult };

/**
 * Edax エンジンのインスタンスを生成します。
 */
export function createEdaxEngine(
  config: IEngineConfig = {},
): IEngine<IReversiSearchOptions, IReversiSearchInfo, IReversiSearchResult> {
  return new EdaxAdapter(config) as unknown as IEngine<
    IReversiSearchOptions,
    IReversiSearchInfo,
    IReversiSearchResult
  >;
}
