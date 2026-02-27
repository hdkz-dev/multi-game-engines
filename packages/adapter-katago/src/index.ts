import { KataGoAdapter } from "./KataGoAdapter.js";
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

export { KataGoAdapter };

/**
 * KataGo エンジンのインスタンスを生成します。
 */
export function createKataGoEngine(
  config: IEngineConfig = {},
): IEngine<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("katago", config.version) || {};
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createKataGoEngine] Engine "katago" requires a "main" source, but it was not found in the registry or config.`,
      engineId: "katago",
      i18nKey: "factory.requiresMainSource" as I18nKey,
      i18nParams: { id: "katago" },
    });
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new KataGoAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
