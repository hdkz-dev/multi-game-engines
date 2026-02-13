import { IProtocolParser } from "@multi-game-engines/core";

export class EdaxParser implements IProtocolParser<
  IOthelloSearchOptions,
  IOthelloSearchInfo,
  IOthelloSearchResult
> {
  parseInfo(data: string | Record<string, unknown>): IOthelloSearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.includes("depth")) return null;

    const depth = data.match(/depth (\d+)/)?.[1];
    if (depth) {
      return {
        raw: data,
        depth: parseInt(depth, 10),
      };
    }
    return null;
  }

  parseResult(data: string | Record<string, unknown>): IOthelloSearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("move")) return null;

    const move = data.slice(5).trim();
    if (move) {
      return {
        raw: data,
        bestMove: move,
      };
    }
    return null;
  }

  createSearchCommand(options: IOthelloSearchOptions): string[] {
    const commands: string[] = [];
    const board = String(options.board).replace(/[\r\n\0;]/g, "");
    commands.push(`setboard ${board}`);
    commands.push(`go ${options.depth ?? 20}`);
    return commands;
  }

  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    const sName = String(name).replace(/[\r\n\0;]/g, "");
    const sValue = String(value).replace(/[\r\n\0;]/g, "");
    return `set ${sName} ${sValue}`;
  }
}

export interface IOthelloSearchOptions {
  board: string;
  depth?: number;
  signal?: AbortSignal;
}

export interface IOthelloSearchInfo {
  raw: string;
  depth: number;
}

export interface IOthelloSearchResult {
  raw: string;
  bestMove: string;
}
