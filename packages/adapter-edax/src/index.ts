import { EdaxAdapter } from "./EdaxAdapter.js";
import { EngineFacade, normalizeAndValidateSources } from "@multi-game-engines/core";
import type {
  IEngine,
  IEngineConfig,
  IEngineSourceConfig,
  I18nKey, } from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult, } from "@multi-game-engines/domain-reversi";

export { EdaxAdapter };

/**
 * Edax エンジンのインスタンスを生成します。
 */
export function createEdaxEngine(
  config: IEngineConfig = {},
): IEngine<IReversiSearchOptions, IReversiSearchInfo, IReversiSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("edax", config.version);
  
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: normalizeAndValidateSources(registrySources as Record<string, IEngineSourceConfig>, config, "edax"),
  };

  const adapter = new EdaxAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
