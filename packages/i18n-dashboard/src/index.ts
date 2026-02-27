import ja from "../locales/ja.json" with { type: "json" };
import en from "../locales/en.json" with { type: "json" };
import { createTranslator } from "@multi-game-engines/i18n-core";
import { DashboardKey } from "./types.js";

export * from "./types.js";

/**
 * ダッシュボード専用のロケールデータ。
 */
export const dashboardLocales = {
  ja: ja as unknown as Record<string, unknown>,
  en: en as unknown as Record<string, unknown>,
};

/**
 * ダッシュボード専用の型安全な翻訳関数。
 */
export const tDashboard = createTranslator<DashboardKey>(dashboardLocales.en);

export { ja as dashboardJa, en as dashboardEn };
