import { ISecurityStatus } from "../types.js";

/**
 * SRI検証やCOOP/COEPヘッダーの診断を提供します。
 */
export class SecurityAdvisor {
  /**
   * W3C勧告に基づいたマルチハッシュSRI検証。
   * 最強のアルゴリズムを優先して検証します。
   */
  static async verifySRI(data: ArrayBuffer, sri: string): Promise<boolean> {
    const hashes = sri.split(/\s+/);

    const algoPriority: Record<string, number> = {
      sha256: 1,
      sha384: 2,
      sha512: 3,
    };

    const algoMap: Record<string, string> = {
      sha256: "SHA-256",
      sha384: "SHA-384",
      sha512: "SHA-512",
    };

    // 2026 Best Practice: 最強アルゴリズムを特定し、それのみを検証対象とする (Algorithm Agility)
    let strongestLevel = 0;
    for (const hash of hashes) {
      const [algo] = hash.split("-");
      const priority = algoPriority[algo];
      if (priority > strongestLevel) strongestLevel = priority;
    }

    if (strongestLevel === 0) return false;

    for (const hash of hashes) {
      const [algo, expectedBase64] = hash.split("-");
      if (algoPriority[algo] !== strongestLevel) continue;

      const webCryptoAlgo = algoMap[algo];
      const digest = await crypto.subtle.digest(webCryptoAlgo, data);
      const actualBase64 = btoa(String.fromCharCode(...new Uint8Array(digest)));

      if (actualBase64 === expectedBase64) return true;
    }
    return false;
  }

  /**
   * セキュリティステータスを診断します。
   * COOP/COEPヘッダーの存在を確認します。
   */
  static async checkStatus(): Promise<ISecurityStatus> {
    const isCrossOriginIsolated =
      typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;
    const missingHeaders: string[] = [];

    // 2026 Best Practice: ブラウザ環境でのみヘッダー診断を試行 (CORS/Node.js 考慮)
    if (typeof window !== "undefined" && typeof fetch !== "undefined") {
      try {
        const response = await fetch(window.location.href, { method: "HEAD" });
        const coop = response.headers.get("cross-origin-opener-policy");
        const coep = response.headers.get("cross-origin-embedder-policy");

        if (!coop) missingHeaders.push("cross-origin-opener-policy");
        if (!coep) missingHeaders.push("cross-origin-embedder-policy");
      } catch {
        // HEADリクエスト失敗時は無視
      }
    }

    const sriSupported = typeof crypto !== "undefined" && !!crypto.subtle;

    return {
      isCrossOriginIsolated,
      canUseThreads: isCrossOriginIsolated,
      sriSupported,
      sriEnabled: sriSupported, // 2026: 基本的にサポートされていれば有効とみなす設計
      coopCoepEnabled: isCrossOriginIsolated,
      missingHeaders: missingHeaders.length > 0 ? missingHeaders : undefined,
    };
  }
}
