import {
  IMiddleware,
  IMiddlewareContext,
  IBaseSearchOptions,
} from "@multi-game-engines/core";
import { SearchInfoSchema, ExtendedSearchInfo } from "./schema.js";
import { UI_NORMALIZER_MIDDLEWARE_ID } from "./types.js";

/**
 * エンジンの出力を UI 向けに正規化するミドルウェア。
 */
export class UINormalizerMiddleware<
  T_OPTIONS = IBaseSearchOptions,
  T_INFO_IN extends ExtendedSearchInfo = ExtendedSearchInfo,
  T_RESULT = unknown,
> implements IMiddleware<T_OPTIONS, T_INFO_IN, T_RESULT> {
  readonly id = UI_NORMALIZER_MIDDLEWARE_ID;

  /**
   * info イベントをインターセプトし、バリデーションと正規化を適用する。
   *
   * 2026 Best Practice:
   * ミドルウェアは表示（i18n）に依存せず、純粋なデータ変換のみを担う。
   * インターフェースの制約を遵守しつつ、内部でスキーマ検証を行い
   * 変換後のデータを T_INFO_IN (実質 ExtendedSearchInfo) として返却。
   */
  async onInfo(
    info: T_INFO_IN,
    _context: IMiddlewareContext<T_OPTIONS>,
  ): Promise<T_INFO_IN> {
    const result = SearchInfoSchema.safeParse(info);

    if (!result.success) {
      // ログ出力は開発者向けの英語に統一するか、コンテキストから注入されたロガーを使用する
      console.warn("[UINormalizerMiddleware] Validation failed:", result.error);

      // 2026: 型ガードによる安全な rawText 抽出
      const rawText = (() => {
        if (typeof info === "object" && info !== null && "raw" in info) {
          const obj = info as Record<string, unknown>;
          return String(obj.raw);
        }
        return String(info);
      })();

      return SearchInfoSchema.parse({
        raw: rawText,
        depth: 0,
      }) as T_INFO_IN;
    }

    // result.data is ExtendedSearchInfo, which T_INFO_IN extends.
    return result.data as T_INFO_IN;
  }
}
