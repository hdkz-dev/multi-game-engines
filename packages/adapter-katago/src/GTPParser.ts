import { IProtocolParser, IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult, Brand } from "@multi-game-engines/core";

/** 囲碁用の指し手表記 (q16等) */
export type Move = Brand<string, "Move">;

/** 囲碁用の思考情報 */
export interface IGOSearchInfo extends IBaseSearchInfo {
  depth?: number;
  score?: number;
  winrate?: number;
  visits?: number;
  utility?: number;
  /** 盤面支配率 (0.0 - 1.0 の配列、通常 19x19=361 要素) */
  ownerMap?: number[];
  pv?: Move[];
}

/** 囲碁用の探索結果 */
export interface IGOSearchResult extends IBaseSearchResult {
  bestMove: Move;
  ponder?: Move;
}

/** 囲碁エンジン用の探索オプション拡張 */
export interface IGOSearchOptions extends IBaseSearchOptions {
  sgf?: string; // SGF文字列
  btime?: number;
  wtime?: number;
  byoyomi?: number;
}

export class GTPParser implements IProtocolParser<IGOSearchOptions, IGOSearchInfo, IGOSearchResult> {
  parseInfo(data: string | Uint8Array | Record<string, unknown>): IGOSearchInfo | null {
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

  parseResult(data: string | Uint8Array | Record<string, unknown>): IGOSearchResult | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("= ")) return null;
    const move = line.substring(2).trim();
    if (!move) return null;
    return { bestMove: move as Move, raw: line };
  }

  createSearchCommand(options: IGOSearchOptions): string | string[] {
    const commands: string[] = [];
    if (options.sgf) {
      // 2026 Best Practice: Command Injection Prevention (Keep semicolons for SGF nodes)
      const safeSgf = options.sgf.replace(/[\r\n\0]/g, "");
      commands.push(`loadsgf ${safeSgf}`);
    }
    if (options.btime !== undefined && options.wtime !== undefined && options.byoyomi !== undefined) {
      commands.push(`time_settings ${Math.floor(options.btime / 1000)} ${Math.floor(options.wtime / 1000)} ${Math.floor(options.byoyomi / 1000)}`);
    }
    commands.push("lz-analyze 50"); 
    return commands;
  }

  createStopCommand(): string { return "stop"; }
  createOptionCommand(name: string, value: string | number | boolean): string {
    // 2026 Best Practice: Command Injection Prevention
    const safeName = String(name).replace(/[\r\n\0;]/g, "");
    const safeValue = String(value).replace(/[\r\n\0;]/g, "");
    return `set ${safeName} ${safeValue}`;
  }
}
