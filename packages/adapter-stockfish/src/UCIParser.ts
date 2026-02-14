import {
  IProtocolParser,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  Brand,
  ProtocolValidator,
  EngineError,
  EngineErrorCode,
} from "@multi-game-engines/core";

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
  depth?: number;
  score?: number;
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
export class UCIParser implements IProtocolParser<
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult
> {
  // 2026 Best Practice: 正規表現の事前コンパイルによる高速化 (NPSへの影響最小化)
  // UCI 指し手形式 (a2a4, e7e8q) および UCI 特有の nullmove (0000, (none)) をサポート。
  private static readonly MOVE_REGEX =
    /^([a-h][1-8][a-h][1-8][nbrq]?|0000|\(none\))$/;

  // 2026 Best Practice: Set の定数化による GC 負荷の軽減
  private static readonly UCI_INFO_TOKENS = new Set([
    "depth",
    "seldepth",
    "time",
    "nodes",
    "pv",
    "multipv",
    "score",
    "currmove",
    "currmovenumber",
    "hashfull",
    "nps",
    "tbhits",
    "sbhits",
    "cpuload",
    "string",
    "refutation",
    "currline",
    "wdl",
    "lowerbound",
    "upperbound",
  ]);

  /**
   * 文字列を Move へ変換します。
   */
  private createMove(value: string): Move | null {
    if (!UCIParser.MOVE_REGEX.test(value)) return null;
    return value as Move;
  }

  /**
   * info 行を解析します。
   */
  parseInfo(
    data: string | Uint8Array | Record<string, unknown>,
  ): IChessSearchInfo | null {
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
          info.score =
            scoreType === "mate" ? scoreValue * MATE_SCORE_FACTOR : scoreValue;
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
        case "pv": {
          const moves: Move[] = [];
          while (
            i + 1 < parts.length &&
            !UCIParser.UCI_INFO_TOKENS.has(parts[i + 1])
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

  /**
   * bestmove 行を解析します。
   */
  parseResult(
    data: string | Uint8Array | Record<string, unknown>,
  ): IChessSearchResult | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("bestmove ")) return null;

    const parts = line.split(" ");
    const bestMove = this.createMove(parts[1] || "");
    if (!bestMove) return null;

    const result: IChessSearchResult = {
      bestMove,
      raw: line,
    };

    const ponderIndex = parts.indexOf("ponder");
    if (ponderIndex !== -1 && ponderIndex + 1 < parts.length) {
      const ponder = this.createMove(parts[ponderIndex + 1]);
      if (ponder) result.ponder = ponder;
    }

    return result;
  }

  /**
   * 探索開始コマンドを生成します。
   */
  createSearchCommand(options: IChessSearchOptions): string[] {
    if (!options.fen) {
      throw new EngineError({
        code: EngineErrorCode.INTERNAL_ERROR,
        message: "UCI requires a FEN position.",
        remediation: "Provide a valid FEN string in search options.",
      });
    }

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(options.fen, "FEN string");

    const isStartPos = options.fen.toLowerCase() === "startpos";
    const commands: string[] = [
      isStartPos ? "position startpos" : `position fen ${options.fen}`,
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
    const sValue = String(value);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(name, "option name");
    ProtocolValidator.assertNoInjection(sValue, "option value");

    return `setoption name ${name} value ${sValue}`;
  }
}
