import { KataGoONNXAdapter } from "./KataGoONNXAdapter.js";
import { EngineFacade } from "@multi-game-engines/core";
import type { IEngine, IEngineConfig } from "@multi-game-engines/core";
import type {
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult,
} from "@multi-game-engines/domain-go";

export { KataGoONNXAdapter };
export { KataGoBoard } from "./KataGoBoard.js";
export { encodePosition, decodePolicy } from "./KataGoEncoder.js";

/**
 * @deprecated Use KataGoONNXAdapter — kept for backward compat.
 */
export { KataGoONNXAdapter as KataGoAdapter };

/**
 * KataGo engine backed by ONNX Runtime Web.
 *
 * The model is loaded from `config.sources.main.url`.
 * No Web Worker or proprietary binary required.
 *
 * @example
 * ```typescript
 * const engine = createKataGoEngine({
 *   sources: { main: { url: "https://…/katago-b6c96.onnx" } },
 * });
 * await engine.load();
 * const result = await engine.search({ size: 19, komi: 6.5 });
 * ```
 */
export function createKataGoEngine(
  config: IEngineConfig = {},
): IEngine<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  // ONNX model URL supplied via config.sources — no registry lookup needed.
  const adapter = new KataGoONNXAdapter(config);
  return new EngineFacade(adapter);
}
