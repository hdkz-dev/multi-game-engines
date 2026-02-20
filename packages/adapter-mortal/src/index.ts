import {
  IEngineConfig,
  IEngineAdapter,
  IEngine,
} from "@multi-game-engines/core";
import {
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult,
} from "./MahjongJSONParser.js";
import { MortalAdapter } from "./mortal.js";

export * from "./mortal.js";
export * from "./MahjongJSONParser.js";

/**
 * 2026 Zenith Tier: Mortal アダプターのファクトリ関数。
 */
export function createMortalAdapter(
  config: IEngineConfig,
): IEngineAdapter<
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult
> {
  return new MortalAdapter(config);
}

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    mortal: IEngine<
      IMahjongSearchOptions,
      IMahjongSearchInfo,
      IMahjongSearchResult
    >;
  }
}
