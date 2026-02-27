import { GTPAdapter } from "./GTPAdapter.js";
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
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult,
} from "@multi-game-engines/domain-go";

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
    OfficialRegistry.resolve(config.id || "katago", config.version) || {};
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    const engineId = config.id || "katago";
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createGTPEngine] Engine "${engineId}" requires a "main" source, but it was not found in the registry or config.`,
      engineId,
      i18nKey: "factory.requiresMainSource" as I18nKey,
      i18nParams: { id: engineId },
    });
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new GTPAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
