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
