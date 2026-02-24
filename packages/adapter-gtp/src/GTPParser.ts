import { IProtocolParser, ProtocolValidator } from "@multi-game-engines/core";
import { t as translate } from "@multi-game-engines/i18n";
import {
  createGOMove,
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult,
} from "@multi-game-engines/domain-go";

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
                  .map((m) => {
                    try {
                      return createGOMove(m);
                    } catch {
                      return null;
                    }
                  })
                  .filter((m): m is NonNullable<typeof m> => m !== null)
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

    // 2026 Best Practice: 特殊な指し手 (resign) の正規化
    // resign は有効な応答だが盤面上の指し手はないため null に変換
    if (moveStr.toLowerCase() === "resign") {
      return {
        bestMove: null,
        raw: data,
      };
    }

    try {
      const bestMove = createGOMove(moveStr);
      return {
        bestMove,
        raw: data,
      };
    } catch {
      return null;
    }
  }

  createSearchCommand(options: IGoSearchOptions): string[] {
    // 2026 Best Practice: 探索オプション全体を再帰的にインジェクションチェック
    // GTP/SGF 用にセミコロンを許可
    ProtocolValidator.assertNoInjection(options, "search options", true, true);

    const commands: string[] = [];
    if (options.board) {
      ProtocolValidator.assertNoInjection(options.board, "board data", true);
      // 2026 Best Practice: 局面データが存在する場合、エンジンに反映
      commands.push(`loadsgf ${options.board}`);
    }
    if (options.size !== undefined) commands.push(`boardsize ${options.size}`);
    if (options.komi !== undefined) commands.push(`komi ${options.komi}`);

    // KataGo 分析モードの開始 (明示的に指定された場合のみ)
    if (
      options.kataInterval != null &&
      Number.isFinite(Number(options.kataInterval))
    ) {
      commands.push(`kata-analyze interval ${Number(options.kataInterval)}`);
    }

    return commands;
  }

  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: unknown): string {
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      throw new TypeError(translate("parsers.generic.invalidOptionValue"));
    }
    ProtocolValidator.assertNoInjection(name, "option name");
    ProtocolValidator.assertNoInjection(String(value), "option value");
    return `set_option ${name} ${value}`;
  }
}
