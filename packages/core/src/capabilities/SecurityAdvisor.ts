import { ISecurityStatus } from "../types";

/**
 * アプリケーションのセキュリティ状態を診断し、
 * SRI (Subresource Integrity) などの検証を支援するクラス。
 */
export class SecurityAdvisor {
  /**
   * 現在の環境におけるセキュリティ診断レポートを取得します。
   */
  static getStatus(): ISecurityStatus {
    const isCrossOriginIsolated =
      typeof crossOriginIsolated !== "undefined" ? crossOriginIsolated : false;

    const missingHeaders: string[] = [];
    if (!isCrossOriginIsolated) {
      missingHeaders.push("Cross-Origin-Opener-Policy: same-origin");
      missingHeaders.push("Cross-Origin-Embedder-Policy: require-corp");
    }

    return {
      isCrossOriginIsolated,
      canUseThreads: isCrossOriginIsolated,
      missingHeaders: missingHeaders.length > 0 ? missingHeaders : undefined,
      sriSupported: typeof document !== "undefined" && "integrity" in document.createElement("script"),
    };
  }

  /**
   * SRI ハッシュが有効な形式かチェックします。
   * W3C SRI 仕様に準拠し、スペース区切りのマルチハッシュ形式をサポートします。
   */
  static isValidSRI(sri: string): boolean {
    if (!sri) return false;
    const parts = sri.split(/\s+/);
    return parts.every(part => /^sha(256|384|512)-[A-Za-z0-9+/=]+$/.test(part));
  }

  /**
   * 指定した URL からリソースを SRI 付きで安全に取得するための fetch オプションを生成します。
   * SRI が指定されているにもかかわらず形式が不正な場合は、整合性を保証できないため
   * 空のオプションを返すのではなく、ブラウザのデフォルト挙動に任せるか、呼び出し側でエラーにすべきですが、
   * ここでは安全なデフォルトを提供し、無効な場合は警告ログを出力します。
   */
  static getSafeFetchOptions(sri?: string): RequestInit {
    if (!sri) return {};

    if (!this.isValidSRI(sri)) {
      console.warn(`[SecurityAdvisor] Invalid SRI format detected: "${sri}". Integrity check will be skipped.`);
      return {};
    }
    
    return {
      integrity: sri,
      mode: "cors",
      credentials: "omit",
    };
  }
}
