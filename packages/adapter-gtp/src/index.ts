export * from "./GTPAdapter.js";
export * from "./GTPParser.js";

import { GTPAdapter } from "./GTPAdapter.js";
import { IEngineConfig, IEngineAdapter } from "@multi-game-engines/core";
import {
  IGOSearchOptions,
  IGOSearchInfo,
  IGOSearchResult,
} from "./GTPParser.js";

export function createGTPAdapter(
  config: IEngineConfig,
): IEngineAdapter<IGOSearchOptions, IGOSearchInfo, IGOSearchResult> {
  return new GTPAdapter(config);
}
