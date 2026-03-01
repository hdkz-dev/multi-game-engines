import { USIAdapter } from "./USIAdapter.js";
import {
  EngineFacade,
  EngineError,
  EngineErrorCode,
  normalizeAndValidateSources
} from "@multi-game-engines/core";
import type {
  IEngine,
  IEngineConfig,
  IEngineSourceConfig,
  I18nKey,
} from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/domain-shogi";

export { USIAdapter };
export { USIParser } from "./USIParser.js";
export type { IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult };

/**
 * USI エンジンのインスタンスを生成します。
 */
export function createUSIEngine(
  config: IEngineConfig = {},
): IEngine<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve(config.id || "yaneuraou", config.version);
  
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: normalizeAndValidateSources(registrySources as Record<string, IEngineSourceConfig>, config, "yaneuraou"),
  };

  const adapter = new USIAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
