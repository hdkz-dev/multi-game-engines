import {
  IProtocolParser,
  ProtocolValidator,
  Brand,
} from "@multi-game-engines/core";

/** 麻雀の指し手（打牌、副露等） */
export type MahjongMove = Brand<string, "MahjongMove">;

export class MahjongJSONParser implements IProtocolParser<
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult
> {
  parseInfo(data: string | Record<string, unknown>): IMahjongSearchInfo | null {
    const record: Record<string, unknown> =
      typeof data === "string"
        ? (JSON.parse(data) as Record<string, unknown>)
        : data;
    if (record.type === "info") {
      return {
        raw: typeof data === "string" ? data : JSON.stringify(data),
        thinking: String(record.thinking ?? ""),
      };
    }
    return null;
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IMahjongSearchResult | null {
    const record: Record<string, unknown> =
      typeof data === "string"
        ? (JSON.parse(data) as Record<string, unknown>)
        : data;
    if (record.type === "result") {
      return {
        raw: typeof data === "string" ? data : JSON.stringify(data),
        bestMove: String(record.bestMove ?? "") as MahjongMove,
      };
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
