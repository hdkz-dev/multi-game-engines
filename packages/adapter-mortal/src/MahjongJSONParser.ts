import {
  IProtocolParser,
  ProtocolValidator,
  Brand,
} from "@multi-game-engines/core";

/** 麻雀の指し手（打牌、副露等） */
export type MahjongMove = Brand<string, "MahjongMove">;

/**
 * 文字列を MahjongMove へ変換します。
 * 2026 Best Practice: Branded Type へのキャスト前にバリデーションを実施します。
 */
function createMahjongMove(value: unknown): MahjongMove | null {
  if (typeof value !== "string" || value.length === 0) return null;
  // 必要に応じて詳細な指し手バリデーションをここに追加可能
  return value as MahjongMove;
}

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
    } catch (_e) {
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
        const bestMove = createMahjongMove(parsed.bestMove);
        if (!bestMove) return null;

        return {
          raw: typeof data === "string" ? data : JSON.stringify(data),
          bestMove,
        };
      }
    } catch (_e) {
      return null;
    }
    return null;
  }

  createSearchCommand(options: IMahjongSearchOptions): Record<string, unknown> {
    // 2026 Best Practice: JSON 形式であっても制御文字インジェクションを警戒
    // オブジェクト内の全ての文字列値を再帰的に検証します
    const validateValue = (value: unknown, path: string = "board"): void => {
      if (typeof value === "string") {
        ProtocolValidator.assertNoInjection(
          value,
          `mahjong board data: ${path}`,
          true,
        );
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((v, i) => {
          validateValue(v, `${path}[${i}]`);
        });
        return;
      }
      if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          validateValue(v, `${path}.${k}`);
        }
      }
    };
    validateValue(options.board);

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

export interface IMahjongSearchOptions {
  board: unknown;
  signal?: AbortSignal;
}

export interface IMahjongSearchInfo {
  raw: string;
  thinking: string;
}

export interface IMahjongSearchResult {
  raw: string;
  bestMove: MahjongMove;
}
