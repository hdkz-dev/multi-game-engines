import { UCIAdapter } from "./UCIAdapter.js";
import { IEngineConfig, IEngine, EngineFacade } from "@multi-game-engines/core";
import {
  UCIParser,
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "./UCIParser.js";

export type { IChessSearchOptions, IChessSearchInfo, IChessSearchResult };
export { UCIParser, UCIAdapter };

/**
 * 2026 Zenith Tier: 汎用 UCI エンジンのファクトリ関数。
 * EngineFacade でラップし、純粋な IEngine インターフェースを返します。
 */
export function createUCIEngine(
  config: IEngineConfig,
): IEngine<IChessSearchOptions, IChessSearchInfo, IChessSearchResult> {
  const adapter = new UCIAdapter(config);
  return new EngineFacade(adapter);
}

/**
 * @deprecated Use createUCIEngine instead.
 */
export function createUCIAdapter(config: IEngineConfig) {
  return new UCIAdapter(config);
}

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    uci: IEngine<IChessSearchOptions, IChessSearchInfo, IChessSearchResult>;
  }
}
