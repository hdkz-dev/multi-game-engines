import {
  IProtocolParser,
  IBaseSearchInfo,
  IBaseSearchResult,
  IScoreInfo,
  ProtocolValidator,
  Move,
} from "@multi-game-engines/core";
import { SFEN } from "@multi-game-engines/domain-shogi";
import { ISHOGISearchOptions } from "./usi-types.js";

/** 将棋用の思考情報 (USI規格) */
export interface ISHOGISearchInfo extends IBaseSearchInfo {
  depth?: number;
  seldepth?: number;
  score?: IScoreInfo;
  nodes?: number;
  nps?: number;
  time?: number;
  pv?: Move[];
}

/** 将棋用の探索結果 (USI規格) */
export interface ISHOGISearchResult extends IBaseSearchResult {
  bestMove: Move | null;
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
  // エンジンが返す 'none' / '(none)' も許容します。
  private static readonly MOVE_REGEX =
    /^[1-9][a-i][1-9][a-i]\+?$|^[PLNSGRB]\*[1-9][a-i]$|^resign$|^win$|^none$|^\(none\)$/i;

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

  /**
   * 文字列を Move へ変換します。
   */
  private createMove(value: string): Move | null {
    if (!USIParser.MOVE_REGEX.test(value)) return null;
    return value as Move;
  }

  /**
   * info 行を解析します。
   * USI 独自のトークン（cpuload 等）は無視し、共通の思考情報を抽出します。
   *
   * @param data - 受信したデータ。
   * @returns 解析された思考情報。info 行でない場合は null。
   */
  parseInfo(
    data: string | Uint8Array | Record<string, unknown>,
  ): ISHOGISearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("info ")) return null;

    const info: ISHOGISearchInfo = { raw: data };
    const parts = data.split(" ");

    for (let i = 1; i < parts.length; i++) {
      const key = parts[i];
      if (key === undefined) continue;
      const hasNext = i + 1 < parts.length;
      const val = hasNext ? parts[i + 1] : undefined;

      switch (key) {
        case "depth":
          info.depth = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "seldepth":
          info.seldepth = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "score":
          if (i + 2 < parts.length) {
            const scoreType = parts[++i];
            const scoreValStr = parts[++i];
            if (scoreType === "cp") {
              info.score = { cp: parseInt(scoreValStr || "0", 10) || 0 };
            } else if (scoreType === "mate") {
              info.score = { mate: parseInt(scoreValStr || "0", 10) || 0 };
            }
          } else {
            i = parts.length; // Skip to end
          }
          break;
        case "nodes":
          info.nodes = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "nps":
          info.nps = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "time":
          info.time = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "hashfull":
          info.hashfull = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "multipv":
          info.multipv = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "pv": {
          const moves: Move[] = [];
          while (
            i + 1 < parts.length &&
            !USIParser.USI_INFO_TOKENS.has(parts[i + 1]!)
          ) {
            const m = this.createMove(parts[++i]!);
            if (m) moves.push(m);
          }
          info.pv = moves;
          break;
        }
      }
    }

    return info;
  }

  /**
   * bestmove 行を解析します。
   * 'none' や '(none)' などの特殊な応答も適切にハンドリングします。
   *
   * @param data - 受信したデータ。
   * @returns 解析された探索結果。
   */
  parseResult(
    data: string | Uint8Array | Record<string, unknown>,
  ): ISHOGISearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("bestmove ")) return null;

    const parts = data.split(" ");
    const moveStr = parts[1] || "";

    // 投了や千日手などで指し手がない場合
    if (moveStr === "none" || moveStr === "(none)") {
      return { raw: data, bestMove: null };
    }

    const bestMove = this.createMove(moveStr);
    if (!bestMove) return null;

    const result: ISHOGISearchResult = {
      bestMove,
      raw: data,
    };

    const ponderIndex = parts.indexOf("ponder");
    if (ponderIndex !== -1 && ponderIndex + 1 < parts.length) {
      const ponder = this.createMove(parts[ponderIndex + 1] || "");
      if (ponder) result.ponder = ponder;
    }

    return result;
  }

  /**
   * 探索開始コマンド (position sfen ... -> go ...) を生成します。
   * SFEN のインジェクション検証を行います。
   *
   * @param options - 探索オプション (sfen, btime, wtime, byoyomi, depth, nodes)。
   * @returns 実行すべき USI コマンド配列。
   */
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
