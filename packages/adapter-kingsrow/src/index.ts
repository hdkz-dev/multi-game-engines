import { KingsRowAdapter } from "./KingsRowAdapter.js";
import { EngineFacade } from "@multi-game-engines/core";
import type { IEngine, IEngineConfig } from "@multi-game-engines/core";
import type {
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult,
} from "@multi-game-engines/domain-checkers";

export { KingsRowAdapter };
export {
  RapidDraughtsAdapter,
  createKingsRowAdapter,
  createRapidDraughtsAdapter,
} from "./KingsRowAdapter.js";
export { KingsRowParser, RapidDraughtsParser } from "./KingsRowParser.js";

/**
 * English Draughts (checkers) engine powered by rapid-draughts.
 *
 * No loader, no Worker, no WASM — rapid-draughts is a bundled npm dependency.
 * Simply create and call `load()` + `search()`.
 *
 * @example
 * ```typescript
 * const engine = createKingsRowEngine();
 * await engine.load();
 * const result = await engine.search({ board: "startpos" });
 * console.log(result.bestMove); // e.g. "11-15"
 * ```
 */
export function createKingsRowEngine(
  config: IEngineConfig = {},
): IEngine<ICheckersSearchOptions, ICheckersSearchInfo, ICheckersSearchResult> {
  // rapid-draughts is a bundled npm dep — no registry source URLs needed.
  const adapter = new KingsRowAdapter(config);
  return new EngineFacade(adapter);
}

/** @deprecated Use createKingsRowEngine */
export const createRapidDraughtsEngine = createKingsRowEngine;
