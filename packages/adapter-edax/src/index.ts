import { EdaxAdapter } from "./EdaxAdapter.js";
import { IEngine, IEngineConfig, EngineFacade } from "@multi-game-engines/core";
import {
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult,
} from "./EdaxParser.js";

export { EdaxAdapter };
export { EdaxParser } from "./EdaxParser.js";
export { IReversiSearchOptions, IReversiSearchInfo, IReversiSearchResult };

/**
 * Edax エンジンのインスタンスを生成します。
 */
export function createEdaxEngine(
  config: IEngineConfig = {},
): IEngine<IReversiSearchOptions, IReversiSearchInfo, IReversiSearchResult> {
  const adapter = new EdaxAdapter(config);
  return new EngineFacade(adapter);
}
