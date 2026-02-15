import ja from "./locales/ja.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };

export const locales = { ja, en };
export type LocaleData = typeof ja;
