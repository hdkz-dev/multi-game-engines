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
      recommendedActions: !isCrossOriginIsolated
        ? ["Enable COOP/COEP headers to support multi-threading."]
        : undefined,
    };
  }

  /**
   * SRI ハッシュが有効な形式かチェックします。
   */
  static isValidSRI(sri: string): boolean {
    return /^sha(256|384|512)-[A-Za-z0-9+/=]+$/.test(sri);
  }

  /**
   * 指定した URL からリソースを SRI 付きで安全に取得するための fetch オプションを生成します。
   */
  static getSafeFetchOptions(sri?: string): RequestInit {
    if (!sri || !this.isValidSRI(sri)) return {};
    
    return {
      integrity: sri,
      mode: "cors",
      credentials: "omit",
    };
  }
}
