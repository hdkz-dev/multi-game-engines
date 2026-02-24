import { MortalAdapter } from "./MortalAdapter.js";
import { EngineFacade } from "@multi-game-engines/core";
import type {
  IEngine,
  IEngineConfig,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult,
} from "@multi-game-engines/domain-mahjong";

export { MortalAdapter };

/**
 * Mortal エンジンのインスタンスを生成します。
 */
export function createMortalEngine(
  config: IEngineConfig = {},
): IEngine<IMahjongSearchOptions, IMahjongSearchInfo, IMahjongSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("mortal", config.version) || {};
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: {
      ...(registrySources as Record<string, IEngineSourceConfig>),
      ...(config.sources || {}),
    } as Required<IEngineConfig>["sources"],
  };

  const adapter = new MortalAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
