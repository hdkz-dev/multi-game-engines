import { EdaxAdapter } from "./EdaxAdapter.js";
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
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult,
} from "@multi-game-engines/domain-reversi";

export { EdaxAdapter };

/**
 * Edax エンジンのインスタンスを生成します。
 */
export function createEdaxEngine(
  config: IEngineConfig = {},
): IEngine<IReversiSearchOptions, IReversiSearchInfo, IReversiSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve("edax", config.version) || {};
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createEdaxEngine] Engine "edax" requires a "main" source, but it was not found in the registry or config.`,
      engineId: "edax",
      i18nKey: "factory.requiresMainSource" as I18nKey,
      i18nParams: { id: "edax" },
    });
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new EdaxAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
