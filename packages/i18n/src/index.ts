import ja from "./locales/ja.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };

export * from "./types.js";
export const locales = { ja, en };
export type LocaleData = typeof ja;

/**
 * 簡易的な翻訳関数。
 * ネストされたキー（例: "engine.errors.timeout"）を解決し、パラメータを置換します。
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  lang: "ja" | "en" = "en",
): string {
  const data = locales[lang];
  const parts = key.split(".");
  let current: unknown = data;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }

  let message = String(current);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      message = message.replace(`{${k}}`, String(v));
    });
  }
  return message;
}
