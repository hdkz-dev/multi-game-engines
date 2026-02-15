import {
  IProtocolParser,
  IBaseSearchInfo,
  IBaseSearchResult,
  ProtocolValidator,
} from "@multi-game-engines/core";
import { ISHOGISearchOptions, Move } from "./usi-types.js";

/** 将棋用の思考情報 (USI規格) */
export interface ISHOGISearchInfo extends IBaseSearchInfo {
  depth?: number;
  seldepth?: number;
  score?: number;
  nodes?: number;
  nps?: number;
  time?: number;
  pv?: Move[];
}

/** 将棋用の探索結果 (USI規格) */
export interface ISHOGISearchResult extends IBaseSearchResult {
  bestMove: Move;
  ponder?: Move;
}

/**
 * 将棋エンジン向けの USI (Universal Shogi Interface) プロトコルパーサー。
 */
export class USIParser implements IProtocolParser<
  ISHOGISearchOptions,
  ISHOGISearchInfo,
  ISHOGISearchResult
> {
  // 2026 Best Practice: 正規表現の事前コンパイル
  // USI 指し手形式 (7g7f, 8h2b+ 等) および nullmove (resign, win 等)
  // 玉 (K) のドロップはルール上存在しないため除外
  private static readonly MOVE_REGEX =
    /^[1-9][a-i][1-9][a-i]\+?$|^[PLNSGRB]\*[1-9][a-i]$|^resign$|^win$/i;

  // 2026 Best Practice: Set の定数化による効率化
  private static readonly USI_INFO_TOKENS = new Set([
    "depth",
    "seldepth",
    "time",
    "nodes",
    "nps",
    "score",
    "hashfull",
    "cpuload",
    "multipv",
    "pv",
    "string",
    "currline",
  ]);

  // 詰みスコアの係数
  private static readonly MATE_SCORE_FACTOR = 100000;

  /**
   * 文字列を Move へ変換します。
   */
  private createMove(value: string): Move | null {
    if (!USIParser.MOVE_REGEX.test(value)) return null;
    return value as Move;
  }

  parseInfo(
    data: string | Uint8Array | Record<string, unknown>,
  ): ISHOGISearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("info ")) return null;

    const info: ISHOGISearchInfo = { raw: data };
    const parts = data.split(" ");

    for (let i = 1; i < parts.length; i++) {
      const key = parts[i];
      const val = parts[i + 1];

      switch (key) {
        case "depth":
          info.depth = parseInt(val, 10);
          i++;
          break;
        case "seldepth":
          info.seldepth = parseInt(val, 10);
          i++;
          break;
        case "score":
          if (parts[i + 1] === "cp") {
            info.score = parseInt(parts[i + 2], 10);
          } else if (parts[i + 1] === "mate") {
            // USI mate スコアを係数倍して正規化
            info.score =
              parseInt(parts[i + 2], 10) * USIParser.MATE_SCORE_FACTOR;
          }
          i += 2;
          break;
        case "nodes":
          info.nodes = parseInt(val, 10);
          i++;
          break;
        case "nps":
          info.nps = parseInt(val, 10);
          i++;
          break;
        case "time":
          info.time = parseInt(val, 10);
          i++;
          break;
        case "pv": {
          const moves: Move[] = [];
          while (
            i + 1 < parts.length &&
            !USIParser.USI_INFO_TOKENS.has(parts[i + 1])
          ) {
            const m = this.createMove(parts[++i]);
            if (m) moves.push(m);
          }
          info.pv = moves;
          break;
        }
      }
    }

    return info;
  }

  parseResult(
    data: string | Uint8Array | Record<string, unknown>,
  ): ISHOGISearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("bestmove ")) return null;

    const parts = data.split(" ");
    const bestMove = this.createMove(parts[1] || "");
    if (!bestMove) return null;

    const result: ISHOGISearchResult = {
      bestMove,
      raw: data,
    };

    const ponderIndex = parts.indexOf("ponder");
    if (ponderIndex !== -1 && ponderIndex + 1 < parts.length) {
      const ponder = this.createMove(parts[ponderIndex + 1]);
      if (ponder) result.ponder = ponder;
    }

    return result;
  }

  createSearchCommand(options: ISHOGISearchOptions): string[] {
    const commands: string[] = [];
    if (options.sfen) {
      // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
      ProtocolValidator.assertNoInjection(options.sfen, "SFEN string");
      commands.push(`position sfen ${options.sfen}`);
    }

    let goCmd = "go";
    if (options.btime !== undefined) goCmd += ` btime ${options.btime}`;
    if (options.wtime !== undefined) goCmd += ` wtime ${options.wtime}`;
    if (options.byoyomi !== undefined) goCmd += ` byoyomi ${options.byoyomi}`;
    if (options.depth !== undefined) goCmd += ` depth ${options.depth}`;
    if (options.nodes !== undefined) goCmd += ` nodes ${options.nodes}`;

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
    const sValue = String(value);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(name, "option name");
    ProtocolValidator.assertNoInjection(sValue, "option value");

    return `setoption name ${name} value ${sValue}`;
  }
}
