import { IEngineConfig, IEngine, deepMerge } from "@multi-game-engines/core";
import { USIAdapter } from "@multi-game-engines/adapter-usi";
import { IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult, } from "@multi-game-engines/domain-shogi";

/**
 * 2026 Zenith Tier: やねうら王専用アダプター。
 * 汎用的な USIAdapter を拡張し、デフォルト設定を提供します。
 */
export class YaneuraouAdapter extends USIAdapter {
  constructor(config?: Partial<IEngineConfig>) {
    const defaultConfig: IEngineConfig = {
      id: "yaneuraou",
      adapter: "usi",
      name: "Yaneuraou",
      version: "7.5.0",
    };
    const finalConfig = deepMerge(defaultConfig, config);
    super(finalConfig);
  }
}

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    yaneuraou: IEngine<
      IShogiSearchOptions,
      IShogiSearchInfo,
      IShogiSearchResult
    >;
  }
}
