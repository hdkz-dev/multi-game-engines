import { YaneuraouAdapter } from "./YaneuraouAdapter.js";
import { IEngine, IEngineConfig, EngineFacade } from "@multi-game-engines/core";
import {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/adapter-usi";

export { YaneuraouAdapter };

/**
 * やねうら王エンジンのインスタンスを生成します。
 */
export function createYaneuraouEngine(
  config: IEngineConfig = {},
): IEngine<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult> {
  const adapter = new YaneuraouAdapter(config);
  return new EngineFacade(adapter);
}

export * from "@multi-game-engines/adapter-usi";
