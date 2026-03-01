import { KataGoAdapter } from "./KataGoAdapter.js";
import { EngineFacade, normalizeAndValidateSources } from "@multi-game-engines/core";
import type {
  IEngine,
  IEngineConfig,
  IEngineSourceConfig,
  I18nKey, } from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult, } from "@multi-game-engines/domain-go";

export { KataGoAdapter };

/**
 * KataGo エンジンのインスタンスを生成します。
 */
export function createKataGoEngine(
  config: IEngineConfig = {},
): IEngine<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("katago", config.version);
  
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: normalizeAndValidateSources(registrySources as Record<string, IEngineSourceConfig>, config, "katago"),
  };

  const adapter = new KataGoAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
