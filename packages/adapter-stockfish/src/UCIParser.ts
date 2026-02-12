import { IProtocolParser, IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult, Brand } from "@multi-game-engines/core";

/** チェス用の局面表記 (Forsyth-Edwards Notation) */
export type FEN = Brand<string, "FEN">;
/** チェス用の指し手表記 (e2e4等) */
export type Move = Brand<string, "Move">;

/** チェス用の探索オプション (UCI標準規格) */
export interface IChessSearchOptions extends IBaseSearchOptions {
  fen?: FEN;
  depth?: number;
  time?: number;
  nodes?: number;
}

/** チェス用の思考情報 */
export interface IChessSearchInfo extends IBaseSearchInfo {
  depth: number;
  score: number;
  nps?: number;
  time?: number;
  pv?: Move[];
}

/** チェス用の探索結果 */
export interface IChessSearchResult extends IBaseSearchResult {
  bestMove: Move;
  ponder?: Move;
}

/** 詰みスコアを cp と区別するための係数 (2026 Best Practice) */
const MATE_SCORE_FACTOR = 10000;

/**
 * 汎用的な UCI (Universal Chess Interface) プロトコルパーサー。
 */
export class UCIParser implements IProtocolParser<IChessSearchOptions, IChessSearchInfo, IChessSearchResult> {
  /**
   * info 行を解析します。
   */
  parseInfo(data: string | Uint8Array | unknown): IChessSearchInfo | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("info ")) return null;

    const info: IChessSearchInfo = {
      depth: 0,
      score: 0,
      raw: line,
    };

    const parts = line.split(" ");
    for (let i = 1; i < parts.length; i++) {
      const key = parts[i];
      const val = parts[i + 1];

      switch (key) {
        case "depth":
          info.depth = parseInt(val, 10) || 0;
          i++;
          break;
        case "score": {
          const scoreType = parts[++i]; // "cp" or "mate"
          const scoreValue = parseInt(parts[++i], 10) || 0;
          info.score = scoreType === "mate" ? scoreValue * MATE_SCORE_FACTOR : scoreValue;
          break;
        }
        case "nps":
          info.nps = parseInt(val, 10) || 0;
          i++;
          break;
        case "time":
          info.time = parseInt(val, 10) || 0;
          i++;
          break;
        case "pv":
          info.pv = parts.slice(i + 1) as Move[];
          i = parts.length;
          break;
      }
    }

    return info;
  }

  /**
   * bestmove 行を解析します。
   */
  parseResult(data: string | Uint8Array | unknown): IChessSearchResult | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("bestmove ")) return null;

    const parts = line.split(" ");
    const result: IChessSearchResult = {
      bestMove: (parts[1] || "") as Move,
      raw: line,
    };

    const ponderIndex = parts.indexOf("ponder");
    if (ponderIndex !== -1 && ponderIndex + 1 < parts.length) {
      result.ponder = parts[ponderIndex + 1] as Move;
    }

    return result;
  }

  /**
   * 探索開始コマンドを生成します。
   */
  createSearchCommand(options: IChessSearchOptions): string[] {
    if (!options.fen) {
      throw new Error("UCI requires a FEN position");
    }
    const safeFen = options.fen.replace(/[\r\n\0;]/g, "");
    
    const commands: string[] = [
      `position fen ${safeFen}`
    ];

    let goCmd = "go";
    if (options.depth) goCmd += ` depth ${options.depth}`;
    if (options.time) goCmd += ` movetime ${options.time}`;
    if (options.nodes) goCmd += ` nodes ${options.nodes}`;
    
    commands.push(goCmd);
    return commands;
  }

  /**
   * 探索停止コマンドを生成します。
   */
  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    return `setoption name ${name} value ${value}`;
  }
}
