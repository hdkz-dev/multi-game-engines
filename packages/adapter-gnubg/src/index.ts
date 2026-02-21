import { GNUBGAdapter } from "./GNUBGAdapter.js";
import { IEngine, IEngineConfig, EngineFacade } from "@multi-game-engines/core";
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
  const adapter = new GNUBGAdapter(config);
  return new EngineFacade(adapter);
}
