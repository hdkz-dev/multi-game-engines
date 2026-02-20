import {
  IEngineConfig,
  IEngineAdapter,
  IEngine,
} from "@multi-game-engines/core";
import {
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult,
} from "./EdaxParser.js";
import { EdaxAdapter } from "./edax.js";

export * from "./edax.js";
export * from "./EdaxParser.js";

/**
 * 2026 Zenith Tier: Edax アダプターのファクトリ関数。
 */
export function createEdaxAdapter(
  config: IEngineConfig,
): IEngineAdapter<
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult
> {
  return new EdaxAdapter(config);
}

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    edax: IEngine<
      IReversiSearchOptions,
      IReversiSearchInfo,
      IReversiSearchResult
    >;
  }
}
