import { UCIAdapter } from "./UCIAdapter.js";
import {
  EngineFacade,
  EngineError,
  EngineErrorCode,
} from "@multi-game-engines/core";
import type {
  IEngineConfig,
  IEngine,
  IEngineSourceConfig,
  I18nKey,
} from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import { UCIParser } from "./UCIParser.js";
import type {
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "@multi-game-engines/domain-chess";

export type { IChessSearchOptions, IChessSearchInfo, IChessSearchResult };
export { UCIParser, UCIAdapter };

/**
 * 2026 Zenith Tier: 汎用 UCI エンジンのファクトリ関数。
 * EngineFacade でラップし、純粋な IEngine インターフェースを返します。
 */
export function createUCIEngine(
  config: IEngineConfig = {},
): IEngine<IChessSearchOptions, IChessSearchInfo, IChessSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  const registrySources =
    OfficialRegistry.resolve(config.id || "stockfish", config.version) || {};
  const sources = {
    ...(registrySources as Record<string, IEngineSourceConfig>),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    const engineId = config.id || "stockfish";
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createUCIEngine] Engine "${engineId}" requires a "main" source, but it was not found in the registry or config.`,
      engineId,
      i18nKey: "factory.requiresMainSource" as I18nKey,
      i18nParams: { id: engineId },
    });
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: sources as Required<IEngineConfig>["sources"],
  };

  const adapter = new UCIAdapter(mergedConfig);
  return new EngineFacade(adapter);
}

/**
 * @deprecated Use createUCIEngine instead.
 */
export function createUCIAdapter(config: IEngineConfig) {
  return new UCIAdapter(config);
}

// 2026 Best Practice: 宣言併合によるグローバル型安全性の提供
declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    uci: IEngine<IChessSearchOptions, IChessSearchInfo, IChessSearchResult>;
  }
}
