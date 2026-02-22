import {
  IProtocolParser,
  ProtocolValidator,
  IBaseSearchOptions,
  truncateLog,
} from "@multi-game-engines/core";
import {
  MahjongMove,
  validateMahjongBoard,
  createMahjongMove,
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
        return {
          raw: typeof data === "string" ? data : JSON.stringify(data),
          thinking: String(parsed.thinking ?? ""),
        };
      }
    } catch (e) {
      console.warn("[MahjongJSONParser] Failed to parse info:", {
        error: e,
        data: truncateLog(data),
      });
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
        if (typeof moveValue !== "string") {
          return null;
        }
        try {
          const bestMove = createMahjongMove(moveValue);
          return {
            raw: typeof data === "string" ? data : JSON.stringify(data),
            bestMove,
          };
        } catch (e) {
          console.warn("[MahjongJSONParser] Invalid bestMove from engine:", e);
          return null;
        }
      }
    } catch (e) {
      console.warn("[MahjongJSONParser] Failed to parse result:", {
        error: e,
        data: truncateLog(data),
      });
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

export interface IMahjongSearchOptions extends IBaseSearchOptions {
  board: Record<string, unknown> | unknown[];
  signal?: AbortSignal;
  [key: string]: unknown;
}

export interface IMahjongSearchInfo {
  raw: string;
  thinking: string;
  [key: string]: unknown;
}

export interface IMahjongSearchResult {
  raw: string;
  bestMove: MahjongMove | null;
  [key: string]: unknown;
}
