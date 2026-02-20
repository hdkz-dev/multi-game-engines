import { GNUBGAdapter } from "./GNUBGAdapter.js";
import { IEngine, IEngineConfig } from "@multi-game-engines/core";
import {
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult,
} from "@multi-game-engines/domain-backgammon";

export { GNUBGAdapter };
export { GNUBGParser } from "./GNUBGParser.js";

/**
 * GNUBG エンジンのインスタンスを生成します。
 */
export function createGNUBGEngine(
  config: IEngineConfig = {},
): IEngine<
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult
> {
  return new GNUBGAdapter(config) as unknown as IEngine<
    IBackgammonSearchOptions,
    IBackgammonSearchInfo,
    IBackgammonSearchResult
  >;
}
