import {
  IProtocolParser,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { ISHOGISearchOptions, Move } from "./usi-types.js";

/** 将棋用の思考情報 */
export interface ISHOGISearchInfo extends IBaseSearchInfo {
  depth?: number;
  score?: number;
  nps?: number;
  time?: number;
  pv?: Move[];
}

/** 将棋用の探索結果 */
export interface ISHOGISearchResult extends IBaseSearchResult {
  bestMove: Move;
  ponder?: Move;
}

/** 
 * 詰みスコアを cp と区別するための係数 (2026 Best Practice)
 */
const MATE_SCORE_FACTOR = 100000;

/**
 * 将棋用 USI (Universal Shogi Interface) プロトコルパーサー。
 */
export class USIParser implements IProtocolParser<ISHOGISearchOptions, ISHOGISearchInfo, ISHOGISearchResult> {
  /**
   * info 行を解析します。
   */
  parseInfo(data: string | Uint8Array | unknown): ISHOGISearchInfo | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("info ")) return null;

    const info: ISHOGISearchInfo = {
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
  parseResult(data: string | Uint8Array | unknown): ISHOGISearchResult | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("bestmove ")) return null;

    const parts = line.split(" ");
    const result: ISHOGISearchResult = {
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
    const safeSfen = options.sfen.replace(/[\r\n\0;]/g, "");
    
    // USI プロトコル仕様: 'startpos' は SFEN キーワードなしで送る
    const positionCmd = safeSfen === "startpos" 
      ? "position startpos" 
      : `position sfen ${safeSfen}`;

    const commands: string[] = [positionCmd];

    let goCmd = "go";
    if (options.depth !== undefined) {
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

  createOptionCommand(name: string, value: string | number | boolean): string {
    return `setoption name ${name} value ${value}`;
  }
}
