import ja from "./locales/ja.js";
import en from "./locales/en.js";
import { createTranslator } from "@multi-game-engines/i18n-core";
import { CommonKey } from "./types.js";

export type * from "./types.js";

/**
 * 共通ドメインのロケールデータ。
 */
export const commonLocales = {
  ja: ja,
  en: en,
};

/**
 * 共通ドメイン用の型安全な翻訳関数。
 */
export const tCommon = createTranslator<CommonKey>(en);

export const getCommonJa = () => ja;
export const getCommonEn = () => en;

/**
 * ロケールデータを非同期で読み込みます（モジュール解決の不整合対策）。
 */
export async function loadCommonLocales() {
  return commonLocales;
}

export { ja as commonJa, en as commonEn };
