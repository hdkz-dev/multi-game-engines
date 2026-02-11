import {
  IProtocolParser,
} from "./types";
import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  Move,
  SFEN,
} from "../types";

/** 詰みスコアを cp と区別するための係数 */
const MATE_SCORE_FACTOR = 100000;

/** SFEN 文字列に含まれてはいけない文字 (Injection対策) */
const UNSAFE_SFEN_CHARS = /[\r\n\0;]/g;

/** 将棋用の探索オプション拡張 */
export interface ISHOGISearchOptions extends IBaseSearchOptions {
  sfen: SFEN;
  btime?: number;
  wtime?: number;
  byoyomi?: number;
}

/**
 * 将棋用 USI (Universal Shogi Interface) プロトコルパーサー。
 */
export class USIParser implements IProtocolParser<ISHOGISearchOptions, IBaseSearchInfo, IBaseSearchResult> {
  /**
   * info 行を解析します。
   */
  parseInfo(line: string): IBaseSearchInfo | null {
    if (!line.startsWith("info ")) return null;

    const info: IBaseSearchInfo = {
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
  parseResult(line: string): IBaseSearchResult | null {
    if (!line.startsWith("bestmove ")) return null;

    const parts = line.split(" ");
    const result: IBaseSearchResult = {
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
  createSearchCommand(options: ISHOGISearchOptions): string[] {
    // インジェクション対策
    // Optimization: Use pre-compiled regex
    const safeSfen = options.sfen.replace(UNSAFE_SFEN_CHARS, "");
    
    const commands: string[] = [
      `position sfen ${safeSfen}`
    ];

    let goCmd = "go";
    if (options.depth) {
      goCmd += ` depth ${options.depth}`;
    } else {
      // 時間制御
      if (options.btime !== undefined) goCmd += ` btime ${options.btime}`;
      if (options.wtime !== undefined) goCmd += ` wtime ${options.wtime}`;
      if (options.byoyomi !== undefined) goCmd += ` byoyomi ${options.byoyomi}`;
      
      // フォールバック
      if (goCmd === "go") goCmd += " infinite";
    }
    
    commands.push(goCmd);
    return commands;
  }

  /**
   * 探索停止コマンドを生成します。
   */
  createStopCommand(): string {
    return "stop";
  }
}
