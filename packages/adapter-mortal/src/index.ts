import { MortalAdapter } from "./mortal.js";
import { IEngine, IEngineConfig } from "@multi-game-engines/core";
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
  return new MortalAdapter(config) as unknown as IEngine<
    IMahjongSearchOptions,
    IMahjongSearchInfo,
    IMahjongSearchResult
  >;
}
