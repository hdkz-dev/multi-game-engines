import { KingsRowAdapter } from "./KingsRowAdapter.js";
import { EngineFacade } from "@multi-game-engines/core";
import type {
  IEngine,
  IEngineConfig,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult,
} from "@multi-game-engines/domain-checkers";

export { KingsRowAdapter };

/**
 * KingsRow チェッカーエンジンのインスタンスを生成します。
 */
export function createKingsRowEngine(
  config: IEngineConfig = {},
): IEngine<ICheckersSearchOptions, ICheckersSearchInfo, ICheckersSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("kingsrow", config.version) || {};
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: {
      ...(registrySources as Record<string, IEngineSourceConfig>),
      ...(config.sources || {}),
    } as Required<IEngineConfig>["sources"],
  };

  const adapter = new KingsRowAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
