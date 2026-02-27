import { I18nKey } from "@multi-game-engines/core";

/**
 * 翻訳データの基本構造。
 */
export type LocaleValue = string | number | boolean | LocaleData;
export interface LocaleData {
  [key: string]: LocaleValue;
}

/**
 * オブジェクトのパス（例: "a.b.c"）から値を取得する純粋関数。
 */
export function getObjectPath(obj: unknown, path: string): unknown {
  if (typeof obj !== "object" || obj === null) return undefined;
  return path.split(".").reduce((prev: unknown, curr) => {
    if (typeof prev === "object" && prev !== null) {
      return (prev as Record<string, unknown>)[curr];
    }
    return undefined;
  }, obj);
}

/**
 * 指定されたロケールデータから翻訳を取得する高階関数。
 */
export function createTranslator<T extends string>(
  localeData: Record<string, unknown>,
) {
  return (
    key: T | (string & I18nKey),
    params?: Record<string, string | number>,
  ): string => {
    const value = getObjectPath(localeData, key as string);
    if (typeof value !== "string") return key as string;
    if (!params) return value;
    return Object.entries(params).reduce((str, [k, v]) => {
      return str.replace(new RegExp(`{${k}}`, "g"), String(v));
    }, value);
  };
}
