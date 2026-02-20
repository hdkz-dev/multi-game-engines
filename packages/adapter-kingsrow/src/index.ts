import { KingsRowAdapter } from "./KingsRowAdapter.js";
import { IEngine, IEngineConfig } from "@multi-game-engines/core";
import {
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult,
} from "@multi-game-engines/domain-checkers";

export { KingsRowAdapter };
export { KingsRowParser } from "./KingsRowParser.js";

/**
 * KingsRow エンジンのインスタンスを生成します。
 */
export function createKingsRowEngine(
  config: IEngineConfig = {},
): IEngine<ICheckersSearchOptions, ICheckersSearchInfo, ICheckersSearchResult> {
  return new KingsRowAdapter(config) as unknown as IEngine<
    ICheckersSearchOptions,
    ICheckersSearchInfo,
    ICheckersSearchResult
  >;
}
