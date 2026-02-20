export * from "./UCIAdapter.js";
export * from "./UCIParser.js";

import { UCIAdapter } from "./UCIAdapter.js";
import { IEngineConfig, IEngineAdapter } from "@multi-game-engines/core";
import {
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "./UCIParser.js";

/**
 * 2026 Zenith Tier: 汎用 UCI アダプターのファクトリ関数。
 */
export function createUCIAdapter(
  config: IEngineConfig,
): IEngineAdapter<IChessSearchOptions, IChessSearchInfo, IChessSearchResult> {
  return new UCIAdapter(config);
}

import { IEngine } from "@multi-game-engines/core";

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    uci: IEngine<IChessSearchOptions, IChessSearchInfo, IChessSearchResult>;
  }
}
