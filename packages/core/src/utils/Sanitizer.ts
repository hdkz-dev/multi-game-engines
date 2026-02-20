/**
 * 2026 Zenith Tier: セキュリティとプライバシーのためのサニタイズユーティリティ。
 */

/**
 * ログ出力用に文字列を切り詰め、機密情報（局面データ等）の全量漏洩を防止します。
 */
export function truncateLog(value: unknown, maxLength = 20): string {
  if (typeof value !== "string") {
    try {
      // 2026 Best Practice: 関数や Symbol 等、stringify が undefined を返すケースを考慮
      const str = JSON.stringify(value);
      if (str === undefined) return "[Unserializable Data]";
      return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
    } catch {
      // 循環参照などの例外
      return "[Unserializable Data]";
    }
  }
  return value.length > maxLength ? value.slice(0, maxLength) + "..." : value;
}
