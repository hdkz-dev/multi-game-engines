import { GTPAdapter } from "./GTPAdapter.js";
import { IEngineConfig, IEngine, EngineFacade } from "@multi-game-engines/core";
import {
  GTPParser,
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult,
} from "./GTPParser.js";

// 2026 Best Practice: 内部実装を隠蔽し、公開インターフェースのみをエクスポート
export type { IGoSearchOptions, IGoSearchInfo, IGoSearchResult };
export { GTPParser, GTPAdapter };

/**
 * 2026 Zenith Tier: GTP エンジンのファクトリ関数。
 * EngineFacade でラップし、純粋な IEngine インターフェースを返します。
 */
export function createGTPEngine(
  config: IEngineConfig,
): IEngine<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  const adapter = new GTPAdapter(config);
  return new EngineFacade(adapter);
}

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    gtp: IEngine<IGoSearchOptions, IGoSearchInfo, IGoSearchResult>;
  }
}
