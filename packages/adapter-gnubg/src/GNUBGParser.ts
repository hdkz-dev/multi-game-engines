import { IProtocolParser, ProtocolValidator } from "@multi-game-engines/core";
import {
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult,
  createBackgammonMove,
} from "@multi-game-engines/domain-backgammon";

/**
 * 2026 Zenith Tier: GNU Backgammon プロトコルパーサー。
 */
export class GNUBGParser implements IProtocolParser<
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult
> {
  parseInfo(
    data: string | Record<string, unknown>,
  ): IBackgammonSearchInfo | null {
    if (typeof data === "object" && data !== null) {
      // JSON プロトコルを想定
      if (data.type === "info") {
        return {
          equity: typeof data.equity === "number" ? data.equity : 0,
          winProbability: typeof data.winProb === "number" ? data.winProb : 0,
          winGammonProbability:
            typeof data.winGammonProb === "number" ? data.winGammonProb : 0,
          winBackgammonProbability:
            typeof data.winBackgammonProb === "number"
              ? data.winBackgammonProb
              : 0,
          raw: data,
        };
      }
      return null;
    }
    return null;
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IBackgammonSearchResult | null {
    if (typeof data === "object" && data !== null) {
      if (data.type === "bestmove") {
        return {
          bestMove: createBackgammonMove(String(data.move ?? "")),
          equity: Number(data.equity) || 0,
          raw: data,
        };
      }
      return null;
    }
    return null;
  }

  createSearchCommand(_options: IBackgammonSearchOptions): string[] {
    // gnubg の CLI コマンドを生成
    return ["analyze"];
  }

  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    ProtocolValidator.assertNoInjection(name, "option name");
    ProtocolValidator.assertNoInjection(String(value), "option value");
    return `set ${name} ${value}`;
  }
}
