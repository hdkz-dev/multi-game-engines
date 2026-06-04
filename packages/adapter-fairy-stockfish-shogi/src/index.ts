import { FairyStockfishShogiAdapter } from "./FairyStockfishShogiAdapter.js";
import {
  EngineFacade,
  normalizeAndValidateSources,
} from "@multi-game-engines/core";
import type { IEngine, IEngineConfig } from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import type {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/domain-shogi";

export { FairyStockfishShogiAdapter };

export function createFairyStockfishShogiEngine(
  config: IEngineConfig = {},
): IEngine<IShogiSearchOptions, IShogiSearchInfo, IShogiSearchResult> {
  const registrySources = OfficialRegistry.resolve(
    "fairy-stockfish-shogi",
    config.version,
  );

  const mergedConfig: IEngineConfig = {
    ...config,
    sources: normalizeAndValidateSources(
      registrySources,
      config,
      "fairy-stockfish-shogi",
    ),
  };

  return new EngineFacade(new FairyStockfishShogiAdapter(mergedConfig));
}
