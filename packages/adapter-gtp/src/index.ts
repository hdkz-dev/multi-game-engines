import { GTPAdapter } from "./GTPAdapter.js";
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

export { GTPAdapter };
export { GTPParser } from "./GTPParser.js";
export type { IGoSearchOptions, IGoSearchInfo, IGoSearchResult };

/**
 * GTP エンジンのインスタンスを生成します。
 */
export function createGTPEngine(
  config: IEngineConfig = {},
): IEngine<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve(config.id || "katago", config.version);
  
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: normalizeAndValidateSources(registrySources as Record<string, IEngineSourceConfig>, config, "katago"),
  };

  const adapter = new GTPAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
