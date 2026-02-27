import { MortalAdapter } from "./MortalAdapter.js";
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
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult,
} from "@multi-game-engines/domain-mahjong";

export { MortalAdapter };

/**
 * Mortal エンジンのインスタンスを生成します。
 */
export function createMortalEngine(
  config: IEngineConfig = {},
): IEngine<IMahjongSearchOptions, IMahjongSearchInfo, IMahjongSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("mortal", config.version) || {};
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createMortalEngine] Engine "mortal" requires a "main" source, but it was not found in the registry or config.`,
      engineId: "mortal",
      i18nKey: "factory.requiresMainSource" as I18nKey,
      i18nParams: { id: "mortal" },
    });
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new MortalAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
