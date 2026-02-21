import { GTPAdapter } from "./GTPAdapter.js";
import { IEngine, IEngineConfig, EngineFacade } from "@multi-game-engines/core";
import {
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult,
} from "./GTPParser.js";

export { GTPAdapter };
export { GTPParser } from "./GTPParser.js";
export { IGoSearchOptions, IGoSearchInfo, IGoSearchResult };

/**
 * GTP エンジンのインスタンスを生成します。
 */
export function createGTPEngine(
  config: IEngineConfig = {},
): IEngine<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  const adapter = new GTPAdapter(config);
  return new EngineFacade(adapter);
}
