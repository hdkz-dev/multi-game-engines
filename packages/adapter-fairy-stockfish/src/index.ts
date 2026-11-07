import { FairyStockfishAdapter } from "./FairyStockfishAdapter.js";
import {
  EngineFacade,
  normalizeAndValidateSources,
} from "@multi-game-engines/core";
import type { IEngine, IEngineConfig } from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "@multi-game-engines/domain-chess";

export { FairyStockfishAdapter };

export function createFairyStockfishEngine(
  config: IEngineConfig = {},
): IEngine<IChessSearchOptions, IChessSearchInfo, IChessSearchResult> {
  const registrySources = OfficialRegistry.resolve(
    "fairy-stockfish",
    config.version,
  );

  const sources = normalizeAndValidateSources(
    registrySources,
    config,
    "fairy-stockfish",
  );
  // Keep default bootstrapping correct when an older compatible registry is installed.
  // A caller-supplied main remains an explicit standalone Worker override.
  if (!config.sources?.main) {
    sources.main = { ...sources.main, workerFactory: "Stockfish" };
  }

  const mergedConfig: IEngineConfig = {
    ...config,
    sources,
  };

  return new EngineFacade(new FairyStockfishAdapter(mergedConfig));
}
