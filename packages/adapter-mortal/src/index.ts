import { MortalAdapter } from "./mortal.js";
import { IEngine, IEngineConfig, EngineFacade } from "@multi-game-engines/core";
import {
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult,
} from "./MahjongJSONParser.js";

export { MortalAdapter };
export { MahjongJSONParser } from "./MahjongJSONParser.js";

/**
 * Mortal エンジンのインスタンスを生成します。
 */
export function createMortalEngine(
  config: IEngineConfig = {},
): IEngine<IMahjongSearchOptions, IMahjongSearchInfo, IMahjongSearchResult> {
  const adapter = new MortalAdapter(config);
  return new EngineFacade(adapter);
}
