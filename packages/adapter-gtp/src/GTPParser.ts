import {
  IProtocolParser,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ProtocolValidator,
} from "@multi-game-engines/core";
import { GOMove, createGOMove } from "@multi-game-engines/domain-go";

/**
 * 囲碁の探索オプション。
 */
export interface IGoSearchOptions extends IBaseSearchOptions {
  size?: number;
  komi?: number;
  /** 盤面データ (SGF等) */
  board?: string;
  /** KataGo 分析インターバル (ms) */
  kataInterval?: number;
  [key: string]: unknown;
}

/**
 * 囲碁の探索状況。
 * 2026 Zenith Tier: KataGo 拡張 GTP を含む詳細な情報。
 */
export interface IGoSearchInfo extends IBaseSearchInfo {
  winrate?: number;
  visits?: number;
  scoreLead?: number;
  pv?: GOMove[];
  /** ヒートマップ（各点の支配率/重要度） */
  ownerMap?: number[];
  [key: string]: unknown;
}

/**
 * 囲碁の探索結果。
 */
export interface IGoSearchResult extends IBaseSearchResult {
  bestMove: GOMove;
  [key: string]: unknown;
}

/**
 * 2026 Zenith Tier: 汎用 GTP (Go Text Protocol) パーサー。
 * KataGo 拡張 (JSON Output) をネイティブサポートします。
 */
export class GTPParser implements IProtocolParser<
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult
> {
  parseInfo(data: string | Record<string, unknown>): IGoSearchInfo | null {
    if (typeof data === "object" && data !== null) {
      // KataGo 拡張 JSON 出力
      if ("visits" in data || "winrate" in data) {
        return {
          visits: Number(data.visits) || 0,
          winrate: Number(data.winrate) || 0,
          scoreLead:
            typeof data.scoreLead === "number" ? data.scoreLead : undefined,
          pv:
            Array.isArray(data.pv) && data.pv.length > 0
              ? data.pv
                  .filter((m): m is string => typeof m === "string" && !!m)
                  .map((m) => createGOMove(m))
              : undefined,
          raw: data,
        };
      }
    }

    return null;
  }

  parseResult(data: string | Record<string, unknown>): IGoSearchResult | null {
    if (typeof data !== "string") return null;

    // GTP 成功応答: "= A1"
    if (!data.startsWith("=")) return null;

    const parts = data.trim().split(/\s+/);
    const moveStr = parts[1];
    if (!moveStr) return null;

    // 2026 Best Practice: 特殊な指し手 (pass, resign) の正規化と検証
    const bestMove = createGOMove(moveStr);

    return {
      bestMove,
      raw: data,
    };
  }

  createSearchCommand(options: IGoSearchOptions): string[] {
    const commands: string[] = [];
    if (options.board) {
      ProtocolValidator.assertNoInjection(options.board, "board data", true);
      // 2026 Best Practice: 局面データが存在する場合、エンジンに反映
      commands.push(`loadsgf ${options.board}`);
    }
    if (options.size !== undefined) commands.push(`boardsize ${options.size}`);
    if (options.komi !== undefined) commands.push(`komi ${options.komi}`);

    // KataGo 分析モードの開始
    const interval = Number(options.kataInterval) || 100;
    commands.push(`kata-analyze interval ${interval}`);

    return commands;
  }

  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    ProtocolValidator.assertNoInjection(name, "option name");
    ProtocolValidator.assertNoInjection(String(value), "option value");
    return `set_option ${name} ${value}`;
  }
}
