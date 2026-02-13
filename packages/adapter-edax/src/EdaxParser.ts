import { IProtocolParser, IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult, Brand } from "@multi-game-engines/core";

/** オセロ用の局面表記 (64文字文字列等) */
export type OthelloBoard = Brand<string, "OthelloBoard">;
/** オセロ用の指し手表記 (c3等) */
export type Move = Brand<string, "Move">;

/** オセロ用の思考情報 */
export interface IOthelloSearchInfo extends IBaseSearchInfo {
  depth?: number;
  score?: number;
  isExact?: boolean;
  pv?: Move[];
}

/** オセロ用の探索結果 */
export interface IOthelloSearchResult extends IBaseSearchResult {
  bestMove: Move;
  ponder?: Move;
}

/** オセロ用の探索オプション拡張 */
export interface IOthelloSearchOptions extends IBaseSearchOptions {
  board?: OthelloBoard;
  isBlack?: boolean;
  depth?: number;
}

export class EdaxParser implements IProtocolParser<IOthelloSearchOptions, IOthelloSearchInfo, IOthelloSearchResult> {
  parseInfo(data: string | Uint8Array | Record<string, unknown>): IOthelloSearchInfo | null {
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

  parseResult(data: string | Uint8Array | Record<string, unknown>): IOthelloSearchResult | null {
    if (typeof data !== "string") return null;
    const line = data.trim();
    const moveMatch = line.match(/^(=?\s*)([a-h][1-8])$/i);
    if (!moveMatch) return null;
    return { bestMove: moveMatch[2].toLowerCase() as Move, raw: line };
  }

  createSearchCommand(options: IOthelloSearchOptions): string | string[] {
    const commands: string[] = [];
    if (options.board) {
      // 2026 Best Practice: Command Injection Prevention
      const safeBoard = options.board.replace(/[\r\n\0;]/g, "");
      commands.push(`setboard ${safeBoard} ${options.isBlack ? 'B' : 'W'}`);
    }
    commands.push(`go ${options.depth || 20}`);
    return commands;
  }

  createStopCommand(): string { return "stop"; }
  createOptionCommand(name: string, value: string | number | boolean): string {
    // 2026 Best Practice: Command Injection Prevention
    const safeName = String(name).replace(/[\r\n\0;]/g, "");
    const safeValue = String(value).replace(/[\r\n\0;]/g, "");
    return `${safeName} ${safeValue}`;
  }
}
