import { GNUBGAdapter } from "./GNUBGAdapter.js";
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
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createGNUBGEngine] Engine "gnubg" requires a "main" source, but it was not found in the registry or config.`,
      engineId: "gnubg",
      i18nKey: "factory.requiresMainSource" as I18nKey,
      i18nParams: { id: "gnubg" },
    });
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new GNUBGAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
