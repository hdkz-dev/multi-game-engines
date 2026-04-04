import ja from "./locales/ja.js";
import en from "./locales/en.js";
import { createTranslator } from "@multi-game-engines/i18n-core";
import { ShogiKey } from "./types.js";

export * from "./types.js";

/**
 * 将棋ドメインのロケールデータ。
 */
export const shogiLocales = {
  ja: ja,
  en: en,
};

/**
 * 将棋ドメイン用の型安全な翻訳関数。
 */
export const tShogi = createTranslator<ShogiKey>(shogiLocales.en);

export { ja as shogiJa, en as shogiEn };
