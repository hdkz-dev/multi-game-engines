import { USIAdapter } from "./USIAdapter.js";
import {
  EngineFacade,
  EngineError,
  EngineErrorCode,
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
    OfficialRegistry.resolve(config.id || "yaneuraou", config.version) || {};
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    const engineId = config.id || "yaneuraou";
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createUSIEngine] Engine "${engineId}" requires a "main" source, but it was not found in the registry or config.`,
      engineId,
      i18nKey: "factory.requiresMainSource" as I18nKey,
      i18nParams: { id: engineId },
    });
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new USIAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
