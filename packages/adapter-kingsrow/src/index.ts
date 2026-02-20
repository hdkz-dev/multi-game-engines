export * from "./KingsRowAdapter.js";
export * from "./KingsRowParser.js";

import { KingsRowAdapter } from "./KingsRowAdapter.js";
import { IEngineConfig, IEngineAdapter } from "@multi-game-engines/core";
import {
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult,
} from "@multi-game-engines/domain-checkers";

/**
 * 2026 Zenith Tier: KingsRow アダプターのファクトリ関数。
 */
export function createKingsRowAdapter(
  config: IEngineConfig,
): IEngineAdapter<
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult
> {
  return new KingsRowAdapter(config);
}

import { IEngine } from "@multi-game-engines/core";

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
