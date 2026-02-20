export * from "./GTPAdapter.js";
export * from "./GTPParser.js";
import { GTPAdapter } from "./GTPAdapter.js";
import { IEngineConfig, IEngineAdapter } from "@multi-game-engines/core";
import {
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult,
} from "./GTPParser.js";

export function createGTPAdapter(
  config: IEngineConfig,
): IEngineAdapter<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  return new GTPAdapter(config);
}

import { IEngine } from "@multi-game-engines/core";

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    gtp: IEngine<IGoSearchOptions, IGoSearchInfo, IGoSearchResult>;
  }
}
