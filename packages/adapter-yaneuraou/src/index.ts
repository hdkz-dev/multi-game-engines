import { YaneuraouAdapter } from "./yaneuraou.js";
import { IEngine, IEngineConfig } from "@multi-game-engines/core";
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
  return new YaneuraouAdapter(config) as unknown as IEngine<
    IShogiSearchOptions,
    IShogiSearchInfo,
    IShogiSearchResult
  >;
}

export * from "@multi-game-engines/adapter-usi";
