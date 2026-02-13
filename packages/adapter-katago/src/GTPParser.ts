import { IProtocolParser } from "@multi-game-engines/core";

export class GTPParser implements IProtocolParser<
  IGOSearchOptions,
  IGOSearchInfo,
  IGOSearchResult
> {
  parseInfo(data: string | Record<string, unknown>): IGOSearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("info")) return null;

    const visits = data.match(/visits (\d+)/)?.[1];
    const winrate = data.match(/winrate ([\d.]+)/)?.[1];

    if (visits || winrate) {
      return {
        raw: data,
        visits: visits ? parseInt(visits, 10) : undefined,
        winrate: winrate ? parseFloat(winrate) : undefined,
      };
    }
    return null;
  }

  parseResult(data: string | Record<string, unknown>): IGOSearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("=")) return null;

    const move = data.slice(2).trim();
    if (move) {
      return {
        raw: data,
        bestMove: move,
      };
    }
    return null;
  }

  createSearchCommand(options: IGOSearchOptions): string[] {
    const commands: string[] = [];
    const board = String(options.board).replace(/[\r\n\0;]/g, "");
    commands.push(`loadboard ${board}`);
    commands.push(`genmove ${options.color}`);
    return commands;
  }

  createStopCommand(): string {
    return "quit";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    const sName = String(name).replace(/[\r\n\0;]/g, "");
    const sValue = String(value).replace(/[\r\n\0;]/g, "");
    return `set_option ${sName} ${sValue}`;
  }
}

export interface IGOSearchOptions {
  board: string;
  color: "black" | "white";
  signal?: AbortSignal;
}

export interface IGOSearchInfo {
  raw: string;
  visits?: number;
  winrate?: number;
}

export interface IGOSearchResult {
  raw: string;
  bestMove: string;
}
