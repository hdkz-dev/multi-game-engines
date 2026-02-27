import {
  IProtocolParser,
  ProtocolValidator,
  truncateLog,
} from "@multi-game-engines/core";
import { tCommon as translate } from "@multi-game-engines/i18n-common";
import {
  validateMahjongBoard,
  createMahjongMove,
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult,
} from "@multi-game-engines/domain-mahjong";

export class MahjongJSONParser implements IProtocolParser<
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult
> {
  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  parseInfo(data: string | Record<string, unknown>): IMahjongSearchInfo | null {
    try {
      const parsed: unknown =
        typeof data === "string" ? JSON.parse(data) : data;

      if (!this.isObject(parsed)) return null;

      if (parsed.type === "info") {
        const evaluations = Array.isArray(parsed.evaluations)
          ? (parsed.evaluations as unknown[])
              .filter(
                (e): e is Record<string, unknown> =>
                  typeof e === "object" && e !== null,
              )
              .map((e) => {
                try {
                  const moveValue = e["move"];
                  if (typeof moveValue !== "string") return null;
                  const move = createMahjongMove(moveValue);
                  return {
                    move,
                    ev: typeof e["ev"] === "number" ? e["ev"] : 0,
                    prob: typeof e["prob"] === "number" ? e["prob"] : undefined,
                  };
                } catch {
                  return null;
                }
              })
              .filter((e): e is NonNullable<typeof e> => e !== null)
          : undefined;

        return {
          raw: typeof data === "string" ? data : JSON.stringify(data),
          thinking: String(parsed.thinking ?? ""),
          evaluations,
        };
      }
    } catch (e) {
      console.warn(
        translate("parsers.generic.parseError", {
          parser: "MahjongJSONParser",
          type: "info",
          error: String(e),
        }),
        { data: truncateLog(data) },
      );
      return null;
    }
    return null;
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IMahjongSearchResult | null {
    try {
      const parsed: unknown =
        typeof data === "string" ? JSON.parse(data) : data;

      if (!this.isObject(parsed)) return null;

      if (parsed.type === "result") {
        const moveValue = parsed.bestMove;
        const raw = typeof data === "string" ? data : JSON.stringify(data);

        // 2026 Best Practice: null/undefined は正当な「指し手なし（和了・流局等）」として扱う
        if (moveValue === null || moveValue === undefined) {
          return { raw, bestMove: null };
        }

        if (typeof moveValue !== "string") {
          return null;
        }

        try {
          const bestMove = createMahjongMove(moveValue);
          return { raw, bestMove };
        } catch (e) {
          console.warn(
            translate("parsers.generic.parseError", {
              parser: "MahjongJSONParser",
              type: "bestMove",
              error: String(e),
            }),
          );
          return null;
        }
      }
    } catch (e) {
      console.warn(
        translate("parsers.generic.parseError", {
          parser: "MahjongJSONParser",
          type: "result",
          error: String(e),
        }),
        { data: truncateLog(data) },
      );
      return null;
    }
    return null;
  }

  createSearchCommand(options: IMahjongSearchOptions): Record<string, unknown> {
    // 2026 Best Practice: JSON 形式であっても制御文字インジェクションを警戒
    ProtocolValidator.assertNoInjection(
      JSON.stringify(options.board),
      "board data",
      true,
    );
    validateMahjongBoard(options.board);

    return {
      type: "search",
      board: options.board,
    };
  }

  createStopCommand(): Record<string, unknown> {
    return { type: "stop" };
  }

  createOptionCommand(
    name: string,
    value: string | number | boolean,
  ): Record<string, unknown> {
    const sName = String(name);
    const sValue = String(value);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(sName, "option name", true);
    ProtocolValidator.assertNoInjection(sValue, "option value", true);

    return {
      type: "option",
      name: sName,
      value: sValue,
    };
  }
}
