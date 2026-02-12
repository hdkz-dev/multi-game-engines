import { IProtocolParser, IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult, Brand } from "@multi-game-engines/core";

/** 麻雀の牌表記 (1m, chun等) */
export type MahjongTile = Brand<string, "MahjongTile">;
/** 麻雀の指し手表記 (打牌選択等) */
export type Move = Brand<string, "Move">;

/** 麻雀の鳴き情報 */
export interface IMahjongMeld {
  type: "chi" | "pon" | "kan" | "kankan";
  tiles: MahjongTile[];
  fromPlayer?: number;
}

/** 麻雀用の思考情報 */
export interface IMahjongSearchInfo extends IBaseSearchInfo {
  evaluations?: Array<{
    move: Move;
    ev: number;
    prob?: number;
  }>;
  pv?: Move[];
}

/** 麻雀用の探索結果 */
export interface IMahjongSearchResult extends IBaseSearchResult {
  bestMove: Move;
  ponder?: Move;
}

/** 麻雀用の探索オプション拡張 */
export interface IMahjongSearchOptions extends IBaseSearchOptions {
  hand: MahjongTile[];
  melds?: IMahjongMeld[];
  discards?: MahjongTile[][];
  dora?: MahjongTile[];
  playerWind?: number;
  prevalentWind?: number;
  isRiichi?: boolean[];
}

export class MahjongJSONParser implements IProtocolParser<IMahjongSearchOptions, IMahjongSearchInfo, IMahjongSearchResult> {
  parseInfo(data: string | Uint8Array | unknown): IMahjongSearchInfo | null {
    const json = this.ensureObject(data);
    if (!json || (json.type !== "info" && !json.evaluations)) return null;
    return {
      depth: json.depth || 0,
      score: json.score || 0,
      evaluations: json.evaluations,
      raw: typeof data === "string" ? data : JSON.stringify(data),
    };
  }

  parseResult(data: string | Uint8Array | unknown): IMahjongSearchResult | null {
    const json = this.ensureObject(data);
    if (!json || (json.type !== "result" && !json.bestMove)) return null;
    return {
      bestMove: json.bestMove as Move,
      ponder: json.ponder as Move,
      raw: typeof data === "string" ? data : JSON.stringify(data),
    };
  }

  createSearchCommand(options: IMahjongSearchOptions): string {
    return JSON.stringify({ type: "search", ...options });
  }

  createStopCommand(): string { return JSON.stringify({ type: "stop" }); }
  createOptionCommand(name: string, value: string | number | boolean): string {
    return JSON.stringify({ type: "setoption", name, value });
  }

  private ensureObject(data: unknown): any {
    if (typeof data === "object" && data !== null) return data;
    if (typeof data === "string") {
      try { return JSON.parse(data); } catch { return null; }
    }
    return null;
  }
}
