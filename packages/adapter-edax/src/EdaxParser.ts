import { IProtocolParser, IOthelloSearchOptions, IOthelloSearchInfo, IBaseSearchResult, Move } from "@multi-game-engines/core";

export class EdaxParser implements IProtocolParser<IOthelloSearchOptions, IOthelloSearchInfo, IBaseSearchResult> {
  parseInfo(data: string | Uint8Array | unknown): IOthelloSearchInfo | null {
    if (typeof data !== "string") return null;
    const line = data.trim();
    const info: IOthelloSearchInfo = { depth: 0, score: 0, raw: line };
    const depthMatch = line.match(/Depth:\s*(\d+)/i);
    if (depthMatch) info.depth = parseInt(depthMatch[1], 10);
    const midMatch = line.match(/Mid:\s*([+-]?\d+)/i);
    const exactMatch = line.match(/Exact:\s*([+-]?\d+)/i);
    if (exactMatch) { info.score = parseInt(exactMatch[1], 10); info.isExact = true; }
    else if (midMatch) { info.score = parseInt(midMatch[1], 10); info.isExact = false; }
    const moveMatch = line.match(/move:\s*([a-h][1-8])/i);
    if (moveMatch) info.pv = [moveMatch[1] as Move];
    return (depthMatch || midMatch || exactMatch) ? info : null;
  }

  parseResult(data: string | Uint8Array | unknown): IBaseSearchResult | null {
    if (typeof data !== "string") return null;
    const line = data.trim();
    const moveMatch = line.match(/^(=?\s*)([a-h][1-8])$/i);
    if (!moveMatch) return null;
    return { bestMove: moveMatch[2].toLowerCase() as Move, raw: line };
  }

  createSearchCommand(options: IOthelloSearchOptions): string | string[] {
    const commands: string[] = [];
    if (options.board) commands.push(`setboard ${options.board} ${options.isBlack ? 'B' : 'W'}`);
    commands.push(`go ${options.depth || 20}`);
    return commands;
  }

  createStopCommand(): string { return "stop"; }
  createOptionCommand(name: string, value: string | number | boolean): string { return `${name} ${value}`; }
}
