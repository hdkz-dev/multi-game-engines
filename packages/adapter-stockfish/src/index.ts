import { StockfishAdapter } from "./StockfishAdapter.js";
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
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "@multi-game-engines/domain-chess";

export { StockfishAdapter };

/**
 * Stockfish エンジンのインスタンスを生成します。
 */
export function createStockfishEngine(
  config: IEngineConfig = {},
): IEngine<IChessSearchOptions, IChessSearchInfo, IChessSearchResult> {
  // 2026 Best Practice: ファクトリ関数レベルでレジストリからデフォルトの URL/SRI を解決
  // これにより、アダプター自身を特定のレジストリから疎結合に保つ
  const registrySources =
    OfficialRegistry.resolve("stockfish", config.version);
  
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: normalizeAndValidateSources(registrySources as Record<string, IEngineSourceConfig>, config, "stockfish"),
  };

  const adapter = new StockfishAdapter(mergedConfig);
  return new EngineFacade(adapter);
}
