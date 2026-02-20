export * from "./USIAdapter.js";
export * from "./USIParser.js";
import { USIAdapter } from "./USIAdapter.js";
import { IEngineConfig, IEngineAdapter } from "@multi-game-engines/core";
import {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "./USIParser.js";

export function createUSIAdapter(
  config: IEngineConfig,
): IEngineAdapter<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult> {
  return new USIAdapter(config);
}

import { IEngine } from "@multi-game-engines/core";

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    usi: IEngine<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult>;
  }
}
