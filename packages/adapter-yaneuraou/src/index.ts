import { YaneuraouAdapter } from "./YaneuraouAdapter.js";
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

export { YaneuraouAdapter };

/**
 * やねうら王エンジンのインスタンスを生成します。
 */
export function createYaneuraouEngine(
  config: IEngineConfig = {},
): IEngine<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("yaneuraou", config.version) || {};
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createYaneuraouEngine] Engine "yaneuraou" requires a "main" source, but it was not found in the registry or config.`,
      engineId: "yaneuraou",
      i18nKey: "factory.requiresMainSource" as I18nKey,
      i18nParams: { id: "yaneuraou" },
    });
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new YaneuraouAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
