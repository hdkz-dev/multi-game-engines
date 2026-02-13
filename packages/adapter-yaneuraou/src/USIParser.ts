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
          // cp or mate
          info.score = parseInt(parts[i + 2], 10);
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
        case "pv":
          info.pv = parts.slice(i + 1) as Move[];
          i = parts.length;
          break;
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
    const result: ISHOGISearchResult = {
      bestMove: parts[1] as Move,
      raw: data,
    };

    const ponderIndex = parts.indexOf("ponder");
    if (ponderIndex !== -1 && ponderIndex + 1 < parts.length) {
      result.ponder = parts[ponderIndex + 1] as Move;
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
    const sName = String(name);
    const sValue = String(value);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(sName, "option name");
    ProtocolValidator.assertNoInjection(sValue, "option value");

    return `setoption name ${sName} value ${sValue}`;
  }
}
