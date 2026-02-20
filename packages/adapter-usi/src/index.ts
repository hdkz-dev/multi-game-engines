import { USIAdapter } from "./USIAdapter.js";
import { IEngineConfig, IEngine, EngineFacade } from "@multi-game-engines/core";
import {
  USIParser,
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "./USIParser.js";

export type { IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult };
export { USIParser, USIAdapter };

/**
 * 2026 Zenith Tier: 汎用 USI エンジンのファクトリ関数。
 * EngineFacade でラップし、純粋な IEngine インターフェースを返します。
 */
export function createUSIEngine(
  config: IEngineConfig,
): IEngine<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult> {
  const adapter = new USIAdapter(config);
  return new EngineFacade(adapter);
}

/**
 * @deprecated Use createUSIEngine instead.
 */
export function createUSIAdapter(config: IEngineConfig) {
  return new USIAdapter(config);
}

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    usi: IEngine<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult>;
  }
}
