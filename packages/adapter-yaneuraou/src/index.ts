import { YaneuraouAdapter } from "./YaneuraouAdapter.js";
import { EngineFacade } from "@multi-game-engines/core";
import type {
  IEngine,
  IEngineConfig,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/domain-shogi";

export { YaneuraouAdapter };

/**
 * やねうら王エンジンのインスタンスを生成します。
 */
export function createYaneuraouEngine(
  config: IEngineConfig = {},
): IEngine<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("yaneuraou", config.version) || {};
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: {
      ...(registrySources as Record<string, IEngineSourceConfig>),
      ...(config.sources || {}),
    } as Required<IEngineConfig>["sources"],
  };

  const adapter = new YaneuraouAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
