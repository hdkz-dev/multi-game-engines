import { USIAdapter } from "./USIAdapter.js";
import { IEngine, IEngineConfig } from "@multi-game-engines/core";
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
  return new USIAdapter(config) as unknown as IEngine<
    IShogiSearchOptions,
    IShogiSearchInfo,
    IShogiSearchResult
  >;
}
