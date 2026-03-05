import ja from "./locales/ja.js";
import en from "./locales/en.js";
import { createTranslator } from "@multi-game-engines/i18n-core";
import { ChessKey, DeepRecord } from "./types.js";

export * from "./types.js";

/**
 * チェスドメインのロケールデータ。
 */
export const chessLocales = {
  ja: ja as unknown as DeepRecord,
  en: en as unknown as DeepRecord,
};

/**
 * チェスドメイン用の型安全な翻訳関数。
 */
export const tChess = createTranslator<ChessKey>(chessLocales.en);

export { ja as chessJa, en as chessEn };
