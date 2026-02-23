import { IEngineConfig, IEngine, deepMerge } from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import {
  USIAdapter,
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/adapter-usi";

/**
 * 2026 Zenith Tier: やねうら王専用アダプター。
 * 汎用的な USIAdapter を拡張し、デフォルト設定を提供します。
 */
export class YaneuraouAdapter extends USIAdapter {
  constructor(config?: Partial<IEngineConfig>) {
    // 2026 Best Practice: セントラルレジストリからデフォルトの URL/SRI を解決
    const registrySources = OfficialRegistry.resolve("yaneuraou") || {};

    const defaultConfig: IEngineConfig = {
      id: "yaneuraou",
      adapter: "usi",
      name: "Yaneuraou",
      version: "7.5.0",
      sources: registrySources as IEngineConfig["sources"],
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
