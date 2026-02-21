import { USIAdapter } from "./USIAdapter.js";
import { IEngine, IEngineConfig, EngineFacade } from "@multi-game-engines/core";
import {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "./USIParser.js";

export { USIAdapter };
export { USIParser } from "./USIParser.js";
export { IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult };

/**
 * USI エンジンのインスタンスを生成します。
 */
export function createUSIEngine(
  config: IEngineConfig = {},
): IEngine<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult> {
  const adapter = new USIAdapter(config);
  return new EngineFacade(adapter);
}
