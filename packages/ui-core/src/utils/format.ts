/**
 * 数値を読みやすい形式にフォーマットします (例: 1000 -> 1.0k, 1000000 -> 1.0M)
 * 2026 Best Practice: 国際化や特定の単位表記に対応しやすい共通整形ロジック。
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

/**
 * ミリ秒を秒単位の文字列に変換します。
 */
export const formatTime = (ms: number): string => {
  return (ms / 1000).toFixed(1);
};
