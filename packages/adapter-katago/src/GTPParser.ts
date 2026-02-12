import { IProtocolParser, IGOSearchOptions, IGOSearchInfo, IBaseSearchResult, Move } from "@multi-game-engines/core";

export class GTPParser implements IProtocolParser<IGOSearchOptions, IGOSearchInfo, IBaseSearchResult> {
  parseInfo(data: string | Uint8Array | unknown): IGOSearchInfo | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("info ")) return null;

    const info: IGOSearchInfo = { depth: 0, score: 0, raw: line };
    const parts = line.split(" ");
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "visits") info.visits = parseInt(parts[i + 1], 10);
      if (parts[i] === "winrate") {
        info.winrate = parseFloat(parts[i + 1]);
        info.score = Math.round((info.winrate - 0.5) * 2000);
      }
    }
    return info;
  }

  parseResult(data: string | Uint8Array | unknown): IBaseSearchResult | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("= ")) return null;
    const move = line.substring(2).trim();
    if (!move) return null;
    return { bestMove: move as Move, raw: line };
  }

  createSearchCommand(options: IGOSearchOptions): string | string[] {
    const commands: string[] = [];
    if (options.sgf) commands.push(`loadsgf ${options.sgf}`);
    if (options.btime !== undefined && options.wtime !== undefined && options.byoyomi !== undefined) {
      commands.push(`time_settings ${Math.floor(options.btime / 1000)} ${Math.floor(options.wtime / 1000)} ${Math.floor(options.byoyomi / 1000)}`);
    }
    commands.push("lz-analyze 50"); 
    return commands;
  }

  createStopCommand(): string { return "stop"; }
  createOptionCommand(name: string, value: string | number | boolean): string { return `set ${name} ${value}`; }
}
