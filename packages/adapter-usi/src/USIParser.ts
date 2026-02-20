import {
  IProtocolParser,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IScoreInfo,
  EngineError,
  EngineErrorCode,
  ProtocolValidator,
} from "@multi-game-engines/core";
import {
  SFEN,
  ShogiMove,
  createShogiMove,
} from "@multi-game-engines/domain-shogi";

/**
 * 将棋の探索オプション。
 */
export interface IShogiSearchOptions extends IBaseSearchOptions {
  sfen?: SFEN;
  ponder?: boolean;
  depth?: number;
  nodes?: number;
  time?: number;
  movetime?: number;
  [key: string]: unknown;
}

/**
 * 将棋の探索状況。
 * 2026 Zenith Tier: USI 思考情報の詳細な解析。
 */
export interface IShogiSearchInfo extends IBaseSearchInfo {
  depth?: number;
  seldepth?: number;
  time?: number;
  nodes?: number;
  nps?: number;
  hashfull?: number;
  score?: IScoreInfo;
  pv?: ShogiMove[];
  currMove?: ShogiMove;
  multipv?: number;
  [key: string]: unknown;
}

/**
 * 将棋の探索結果。
 */
export interface IShogiSearchResult extends IBaseSearchResult {
  bestMove: ShogiMove | "none";
  ponder?: ShogiMove;
  [key: string]: unknown;
}

/**
 * 2026 Zenith Tier: 汎用 USI (Universal Shogi Interface) パーサー。
 * 境界チェックと詳細なエラーメッセージを備え、堅牢な解析を提供します。
 */
export class USIParser implements IProtocolParser<
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult
> {
  parseInfo(data: string | Record<string, unknown>): IShogiSearchInfo | null {
    if (typeof data !== "string") return null;

    if (!data.startsWith("info")) return null;

    const info: IShogiSearchInfo = { raw: data };
    const parts = data.split(" ");

    // 2026 Best Practice: 配列境界チェックの徹底
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      switch (part) {
        case "depth":
          if (i + 1 < parts.length) info.depth = parseInt(parts[++i]!, 10);
          break;
        case "seldepth":
          if (i + 1 < parts.length) info.seldepth = parseInt(parts[++i]!, 10);
          break;
        case "time":
          if (i + 1 < parts.length) info.time = parseInt(parts[++i]!, 10);
          break;
        case "nodes":
          if (i + 1 < parts.length) info.nodes = parseInt(parts[++i]!, 10);
          break;
        case "nps":
          if (i + 1 < parts.length) info.nps = parseInt(parts[++i]!, 10);
          break;
        case "hashfull":
          if (i + 1 < parts.length) info.hashfull = parseInt(parts[++i]!, 10);
          break;
        case "score":
          if (i + 2 < parts.length) {
            const type = parts[++i];
            const valToken = parts[++i];
            const value = valToken ? parseInt(valToken, 10) : 0;
            if (type === "cp") {
              info.score = { cp: value };
            } else if (type === "mate") {
              info.score = { mate: value };
            }
          }
          break;
        case "currmove":
          if (i + 1 < parts.length) {
            try {
              info.currMove = createShogiMove(parts[++i]!);
            } catch {
              // 2026 Best Practice: 特定の指し手のパース失敗で全体の解析を止めない
            }
          }
          break;
        case "multipv":
          if (i + 1 < parts.length) info.multipv = parseInt(parts[++i]!, 10);
          break;
        case "pv":
          // PV は残りの要素すべて。各要素を検証
          info.pv = [];
          for (let j = i + 1; j < parts.length; j++) {
            const m = parts[j];
            if (!m) continue;
            try {
              info.pv.push(createShogiMove(m));
            } catch {
              // 不正な指し手はスキップ
            }
          }
          i = parts.length;
          break;
      }
    }

    return info;
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IShogiSearchResult | null {
    if (typeof data !== "string") return null;

    if (!data.startsWith("bestmove")) return null;

    const parts = data.trim().split(" ");
    if (parts.length < 2) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Unexpected bestmove format: "${data}"`,
      });
    }

    const moveStr = parts[1]!;
    const bestMove = moveStr === "none" ? "none" : createShogiMove(moveStr);

    const result: IShogiSearchResult = {
      bestMove,
      raw: data,
    };

    const ponderIdx = parts.indexOf("ponder");
    if (ponderIdx !== -1 && ponderIdx + 1 < parts.length) {
      result.ponder = createShogiMove(parts[ponderIdx + 1]!);
    }

    return result;
  }

  createSearchCommand(options: IShogiSearchOptions): string[] {
    const commands: string[] = [];
    if (options.sfen) {
      // 2026 Best Practice: 局面データに対するインジェクション対策を徹底 (Refuse by Exception)
      ProtocolValidator.assertNoInjection(options.sfen, "SFEN position");
      commands.push(`position sfen ${options.sfen}`);
    } else {
      commands.push("position startpos");
    }

    let goCmd = "go";
    if (options.ponder) goCmd += " ponder";

    // 2026 Best Practice: 各種制限パラメータの構築
    const limits: string[] = [];
    if (options.depth !== undefined) limits.push(`depth ${options.depth}`);
    if (options.nodes !== undefined) limits.push(`nodes ${options.nodes}`);
    if (options.time !== undefined)
      limits.push(`btime ${options.time} wtime ${options.time}`);
    if (options.movetime !== undefined)
      limits.push(`movetime ${options.movetime}`);

    if (limits.length > 0) {
      goCmd += " " + limits.join(" ");
    } else if (!options.ponder) {
      // 制限がなく、ponder でもない場合は分析用無制限
      goCmd += " infinite";
    }

    commands.push(goCmd);
    return commands;
  }

  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    ProtocolValidator.assertNoInjection(name, "option name");
    ProtocolValidator.assertNoInjection(String(value), "option value");
    return `setoption name ${name} value ${value}`;
  }
}
