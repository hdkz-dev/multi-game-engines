import { GNUBGAdapter } from "./GNUBGAdapter.js";
import { EngineFacade } from "@multi-game-engines/core";
import type {
  IEngine,
  IEngineConfig,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult,
} from "@multi-game-engines/domain-backgammon";

export { GNUBGAdapter };

/**
 * GNU Backgammon エンジンのインスタンスを生成します。
 */
export function createGNUBGEngine(
  config: IEngineConfig = {},
): IEngine<
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult
> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("gnubg", config.version) || {};
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: {
      ...(registrySources as Record<string, IEngineSourceConfig>),
      ...(config.sources || {}),
    } as Required<IEngineConfig>["sources"],
  };

  const adapter = new GNUBGAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
