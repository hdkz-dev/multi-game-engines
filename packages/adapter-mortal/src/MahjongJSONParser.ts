import { IProtocolParser } from "@multi-game-engines/core";

export class MahjongJSONParser implements IProtocolParser<
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult
> {
  parseInfo(data: string | Record<string, unknown>): IMahjongSearchInfo | null {
    const record = typeof data === "string" ? JSON.parse(data) : data;
    if (record.type === "info") {
      return {
        raw: typeof data === "string" ? data : JSON.stringify(data),
        thinking: record.thinking,
      };
    }
    return null;
  }

  parseResult(data: string | Record<string, unknown>): IMahjongSearchResult | null {
    const record = typeof data === "string" ? JSON.parse(data) : data;
    if (record.type === "result") {
      return {
        raw: typeof data === "string" ? data : JSON.stringify(data),
        bestMove: record.bestMove,
      };
    }
    return null;
  }

  createSearchCommand(options: IMahjongSearchOptions): Record<string, unknown> {
    return {
      type: "search",
      board: options.board,
    };
  }

  createStopCommand(): Record<string, unknown> {
    return { type: "stop" };
  }

  createOptionCommand(name: string, value: string | number | boolean): Record<string, unknown> {
    return {
      type: "option",
      name,
      value,
    };
  }
}

export interface IMahjongSearchOptions {
  board: unknown;
  signal?: AbortSignal;
}

export interface IMahjongSearchInfo {
  raw: string;
  thinking: string;
}

export interface IMahjongSearchResult {
  raw: string;
  bestMove: string;
}
