import { IEngineConfig, IEngine, EngineFacade } from "@multi-game-engines/core";
import {
  EdaxParser,
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult,
} from "./EdaxParser.js";
import { EdaxAdapter } from "./edax.js";

export type { IReversiSearchOptions, IReversiSearchInfo, IReversiSearchResult };
export { EdaxParser, EdaxAdapter };

/**
 * 2026 Zenith Tier: Edax エンジンのファクトリ関数。
 * EngineFacade でラップし、純粋な IEngine インターフェースを返します。
 */
export function createEdaxEngine(
  config: IEngineConfig,
): IEngine<IReversiSearchOptions, IReversiSearchInfo, IReversiSearchResult> {
  const adapter = new EdaxAdapter(config);
  return new EngineFacade(adapter);
}

/**
 * @deprecated Use createEdaxEngine instead.
 */
export function createEdaxAdapter(config: IEngineConfig) {
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
