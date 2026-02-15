import {
  IMiddleware,
  IMiddlewareContext,
  IBaseSearchOptions,
} from "@multi-game-engines/core";
import { SearchInfoSchema, ExtendedSearchInfo } from "./schema.js";

/**
 * エンジンの出力を UI 向けに正規化するミドルウェア。
 *
 * 入力型を unknown から ExtendedSearchInfo へ変換する。
 */
export class UINormalizerMiddleware<
  T_OPTIONS = IBaseSearchOptions,
  T_INFO_IN = unknown,
  T_RESULT = unknown,
> implements IMiddleware<
  T_OPTIONS,
  T_INFO_IN,
  T_RESULT,
  ExtendedSearchInfo,
  T_RESULT
> {
  /**
   * info イベントをインターセプトし、バリデーションと正規化を適用する。
   */
  async onInfo(
    info: T_INFO_IN,
    _context: IMiddlewareContext<T_OPTIONS>,
  ): Promise<ExtendedSearchInfo> {
    const result = SearchInfoSchema.safeParse(info);

    if (!result.success) {
      console.warn("[UINormalizerMiddleware] Validation failed:", result.error);

      const rawText =
        typeof info === "object" && info !== null && "raw" in info
          ? String((info as { raw: unknown }).raw)
          : String(info);

      return {
        raw: rawText,
        depth: 0,
      } as ExtendedSearchInfo;
    }

    return result.data as ExtendedSearchInfo;
  }
}
