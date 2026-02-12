import { IProtocolParser } from "./types";
import { IMahjongSearchOptions, IMahjongSearchInfo, IBaseSearchResult, Move } from "../types";

/**
 * 麻雀エンジン (Mortal 等) 用の JSON プロトコルパーサー。
 */
export class MahjongJSONParser implements IProtocolParser<IMahjongSearchOptions, IMahjongSearchInfo, IBaseSearchResult> {
  /**
   * JSON 文字列またはオブジェクトから思考状況を解析します。
   */
  parseInfo(data: string | Uint8Array | unknown): IMahjongSearchInfo | null {
    const json = this.ensureObject(data);
    if (!json || (json.type !== "info" && !json.evaluations)) return null;

    return {
      depth: json.depth || 0,
      score: json.score || 0,
      evaluations: json.evaluations,
      raw: typeof data === "string" ? data : JSON.stringify(data),
    };
  }

  /**
   * JSON 文字列またはオブジェクトから最終結果（打牌）を解析します。
   */
  parseResult(data: string | Uint8Array | unknown): IBaseSearchResult | null {
    const json = this.ensureObject(data);
    if (!json || (json.type !== "result" && !json.bestMove)) return null;

    return {
      bestMove: json.bestMove as Move,
      ponder: json.ponder as Move,
      raw: typeof data === "string" ? data : JSON.stringify(data),
    };
  }

  private ensureObject(data: unknown): any {
    if (typeof data === "object" && data !== null) return data;
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 探索コマンドを JSON 文字列として生成します。
   */
  createSearchCommand(options: IMahjongSearchOptions): string {
    return JSON.stringify({
      type: "search",
      ...options,
    });
  }

  createStopCommand(): string {
    return JSON.stringify({ type: "stop" });
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    return JSON.stringify({
      type: "setoption",
      name,
      value,
    });
  }
}
