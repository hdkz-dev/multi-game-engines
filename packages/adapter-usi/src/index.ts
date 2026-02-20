export * from "./USIAdapter.js";
export * from "./USIParser.js";
export * from "./usi-types.js";

import { USIAdapter } from "./USIAdapter.js";
import { IEngineConfig, IEngineAdapter } from "@multi-game-engines/core";
import { ISHOGISearchInfo, ISHOGISearchResult } from "./USIParser.js";
import { ISHOGISearchOptions } from "./usi-types.js";

/**
 * 2026 Zenith Tier: 汎用 USI アダプターのファクトリ関数。
 */
export function createUSIAdapter(
  config: IEngineConfig,
): IEngineAdapter<ISHOGISearchOptions, ISHOGISearchInfo, ISHOGISearchResult> {
  return new USIAdapter(config);
}
