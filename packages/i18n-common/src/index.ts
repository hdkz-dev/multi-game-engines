import ja from "../locales/ja.json" with { type: "json" };
import en from "../locales/en.json" with { type: "json" };
import { createTranslator } from "@multi-game-engines/i18n-core";
import { CommonKey } from "./types.js";

export * from "./types.js";

/**
 * 共通ドメインのロケールデータ。
 */
export const commonLocales = {
  ja: ja as unknown as Record<string, unknown>,
  en: en as unknown as Record<string, unknown>,
};

/**
 * 共通ドメイン用の型安全な翻訳関数。
 */
export const tCommon = createTranslator<CommonKey>(commonLocales.en);

export { ja as commonJa, en as commonEn };
