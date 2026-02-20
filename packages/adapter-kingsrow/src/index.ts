export * from "./KingsRowAdapter.js";
export * from "./KingsRowParser.js";

import { KingsRowAdapter } from "./KingsRowAdapter.js";
import { IEngineConfig, IEngine, EngineFacade } from "@multi-game-engines/core";
import {
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult,
} from "@multi-game-engines/domain-checkers";

/**
 * 2026 Zenith Tier: KingsRow エンジンのファクトリ関数。
 * EngineFacade でラップし、純粋な IEngine インターフェースを返します。
 */
export function createKingsRowEngine(
  config: IEngineConfig,
): IEngine<ICheckersSearchOptions, ICheckersSearchInfo, ICheckersSearchResult> {
  const adapter = new KingsRowAdapter(config);
  return new EngineFacade(adapter);
}

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    kingsrow: IEngine<
      ICheckersSearchOptions,
      ICheckersSearchInfo,
      ICheckersSearchResult
    >;
  }
}
