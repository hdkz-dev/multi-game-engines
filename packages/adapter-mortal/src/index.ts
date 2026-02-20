import { IEngineConfig, IEngine, EngineFacade } from "@multi-game-engines/core";
import {
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult,
} from "./MahjongJSONParser.js";
import { MortalAdapter } from "./mortal.js";

export * from "./mortal.js";
export * from "./MahjongJSONParser.js";

/**
 * 2026 Zenith Tier: Mortal エンジンのファクトリ関数。
 * EngineFacade でラップし、純粋な IEngine インターフェースを返します。
 */
export function createMortalEngine(
  config: IEngineConfig,
): IEngine<IMahjongSearchOptions, IMahjongSearchInfo, IMahjongSearchResult> {
  const adapter = new MortalAdapter(config);
  return new EngineFacade(adapter);
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
