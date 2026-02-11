import {
  IProtocolParser,
} from "./types";
import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  Move,
} from "../types";

/**
 * 汎用的な UCI (Universal Chess Interface) プロトコルパーサー。
 * Stockfish などのチェスエンジン、および派生プロトコルの基底として機能します。
 */
export class UCIParser implements IProtocolParser<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> {
  /**
   * "info depth 10 score cp 50 pv e2e4 ..." 形式の行を解析します。
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
      switch (parts[i]) {
        case "depth":
          info.depth = parseInt(parts[++i], 10);
          break;
        case "score": {
          const scoreType = parts[++i]; // "cp" or "mate"
          const scoreValue = parseInt(parts[++i], 10);
          info.score = scoreType === "mate" ? scoreValue * 10000 : scoreValue;
          break;
        }
        case "nps":
          info.nps = parseInt(parts[++i], 10);
          break;
        case "time":
          info.time = parseInt(parts[++i], 10);
          break;
        case "pv":
          info.pv = parts.slice(i + 1) as Move[];
          i = parts.length; // PV は行の最後まで続く
          break;
      }
    }

    return info;
  }

  /**
   * "bestmove e2e4 ponder e7e5" 形式の行を解析します。
   */
  parseResult(line: string): IBaseSearchResult | null {
    if (!line.startsWith("bestmove ")) return null;

    const parts = line.split(" ");
    const result: IBaseSearchResult = {
      bestMove: parts[1] as Move,
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
  createSearchCommand(options: IBaseSearchOptions): string {
    let cmd = `position fen ${options.fen}
go`;
    if (options.depth) cmd += ` depth ${options.depth}`;
    if (options.time) cmd += ` movetime ${options.time}`;
    if (options.nodes) cmd += ` nodes ${options.nodes}`;
    return cmd;
  }

  /**
   * 探索停止コマンドを生成します。
   */
  createStopCommand(): string {
    return "stop";
  }
}
