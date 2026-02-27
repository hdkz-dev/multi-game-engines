import { KingsRowAdapter } from "./KingsRowAdapter.js";
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
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createKingsRowEngine] Engine "kingsrow" requires a "main" source, but it was not found in the registry or config.`,
      engineId: "kingsrow",
      i18nKey: "factory.requiresMainSource" as I18nKey,
      i18nParams: { id: "kingsrow" },
    });
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new KingsRowAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
