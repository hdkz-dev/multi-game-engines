import { GNUBGAdapter } from "./GNUBGAdapter.js";
import { GNUBGParser } from "./GNUBGParser.js";
import { IEngineConfig, IEngine, EngineFacade } from "@multi-game-engines/core";
import {
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult,
} from "@multi-game-engines/domain-backgammon";

export type {
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult,
};
export { GNUBGParser, GNUBGAdapter };

/**
 * 2026 Zenith Tier: GNU Backgammon エンジンのファクトリ関数。
 * EngineFacade でラップし、純粋な IEngine インターフェースを返します。
 */
export function createGNUBGEngine(
  config: IEngineConfig,
): IEngine<
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult
> {
  const adapter = new GNUBGAdapter(config);
  return new EngineFacade(adapter);
}

/**
 * @deprecated Use createGNUBGEngine instead.
 */
export function createGNUBGAdapter(config: IEngineConfig) {
  return new GNUBGAdapter(config);
}

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
