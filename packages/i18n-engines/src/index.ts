import ja from "../locales/ja.json" with { type: "json" };
import en from "../locales/en.json" with { type: "json" };
import { createTranslator } from "@multi-game-engines/i18n-core";
import { EnginesKey } from "./types.js";

export * from "./types.js";

/**
 * エンジン・レジストリ関連のロケールデータ。
 */
export const enginesLocales = {
  ja: ja as unknown as Record<string, unknown>,
  en: en as unknown as Record<string, unknown>,
};

/**
 * エンジン・レジストリ関連の型安全な翻訳関数。
 */
export const tEngines = createTranslator<EnginesKey>(enginesLocales.en);

export { ja as enginesJa, en as enginesEn };
