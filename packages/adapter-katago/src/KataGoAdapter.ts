import { IEngineConfig, deepMerge } from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import { GTPAdapter } from "@multi-game-engines/adapter-gtp";

/**
 * 2026 Zenith Tier: KataGo 専用アダプター。
 * 汎用的な GTPAdapter を拡張し、デフォルト設定を提供します。
 */
export class KataGoAdapter extends GTPAdapter {
  constructor(config?: Partial<IEngineConfig>) {
    // 2026 Best Practice: セントラルレジストリからデフォルトの URL/SRI を解決
    const registrySources = OfficialRegistry.resolve("katago") || {};

    const defaultConfig: IEngineConfig = {
      id: "katago",
      adapter: "gtp",
      name: "KataGo",
      version: "1.15.0",
      sources: registrySources as IEngineConfig["sources"],
    };
    const finalConfig = deepMerge(defaultConfig, config);
    super(finalConfig);
  }
}
