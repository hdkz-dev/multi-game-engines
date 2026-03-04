import ja from "./locales/ja.js";
import en from "./locales/en.js";
import { createTranslator } from "@multi-game-engines/i18n-core";
import { EnginesKey } from "./types.js";

export * from "./types.js";

/**
 * エンジン・レジストリドメインのロケールデータ。
 */
export const engineLocales = {
  ja: ja as unknown as Record<string, unknown>,
  en: en as unknown as Record<string, unknown>,
};

/**
 * エンジン・レジストリドメイン用の型安全な翻訳関数。
 */
export const tEngines = createTranslator<EnginesKey>(engineLocales.en);

export { ja as enginesJa, en as enginesEn };
