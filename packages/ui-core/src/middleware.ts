import {
  IMiddleware,
  IMiddlewareContext,
  IBaseSearchOptions,
} from "@multi-game-engines/core";
import { SearchInfoSchema, ExtendedSearchInfo } from "./schema.js";

/**
 * エンジンの出力を UI 向けに正規化するミドルウェア。
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
   *
   * 2026 Best Practice:
   * ミドルウェアは表示（i18n）に依存せず、純粋なデータ変換のみを担う。
   */
  async onInfo(
    info: T_INFO_IN,
    _context: IMiddlewareContext<T_OPTIONS>,
  ): Promise<ExtendedSearchInfo> {
    const result = SearchInfoSchema.safeParse(info);

    if (!result.success) {
      // ログ出力は開発者向けの英語に統一するか、コンテキストから注入されたロガーを使用する
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
