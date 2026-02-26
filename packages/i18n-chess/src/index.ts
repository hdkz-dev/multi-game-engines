import ja from "../locales/ja.json" with { type: "json" };
import en from "../locales/en.json" with { type: "json" };
import { createTranslator } from "@multi-game-engines/i18n-core";
import { ChessKey } from "./types.js";

export * from "./types.js";

/**
 * チェスドメインのロケールデータ。
 */
export const chessLocales = {
  ja: ja as unknown as Record<string, unknown>,
  en: en as unknown as Record<string, unknown>,
};

/**
 * チェスドメイン用の型安全な翻訳関数。
 */
export const tChess = createTranslator<ChessKey>(chessLocales.en);

export { ja as chessJa, en as chessEn };
