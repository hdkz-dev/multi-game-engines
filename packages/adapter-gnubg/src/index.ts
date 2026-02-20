export * from "./GNUBGAdapter.js";
export * from "./GNUBGParser.js";

import { GNUBGAdapter } from "./GNUBGAdapter.js";
import { IEngineConfig, IEngineAdapter } from "@multi-game-engines/core";
import {
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult,
} from "@multi-game-engines/domain-backgammon";

/**
 * 2026 Zenith Tier: GNU Backgammon アダプターのファクトリ関数。
 */
export function createGNUBGAdapter(
  config: IEngineConfig,
): IEngineAdapter<
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult
> {
  return new GNUBGAdapter(config);
}

import { IEngine } from "@multi-game-engines/core";

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    gnubg: IEngine<
      IBackgammonSearchOptions,
      IBackgammonSearchInfo,
      IBackgammonSearchResult
    >;
  }
}
