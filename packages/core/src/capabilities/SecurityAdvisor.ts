import { ISecurityStatus } from "../types.js";

/**
 * SRI検証やCOOP/COEPヘッダーの診断を提供します。
 */
export class SecurityAdvisor {
  /**
   * W3C勧告に基づいたマルチハッシュSRI検証。
   */
  static async verifySRI(data: ArrayBuffer, sri: string): Promise<boolean> {
    const hashes = sri.split(/\s+/);
    for (const hash of hashes) {
      const [algo, expectedBase64] = hash.split("-");
      if (!algo || !expectedBase64) continue;

      const algoMap: Record<string, string> = {
        "sha256": "SHA-256",
        "sha384": "SHA-384",
        "sha512": "SHA-512"
      };

      const webCryptoAlgo = algoMap[algo];
      if (!webCryptoAlgo) continue;

      const digest = await crypto.subtle.digest(webCryptoAlgo, data);
      const actualBase64 = btoa(String.fromCharCode(...new Uint8Array(digest)));

      if (actualBase64 === expectedBase64) return true;
    }
    return false;
  }

  static async checkStatus(): Promise<ISecurityStatus> {
    const isCrossOriginIsolated = typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;
    return {
      isCrossOriginIsolated,
      canUseThreads: isCrossOriginIsolated,
      sriSupported: !!crypto.subtle,
    };
  }
}
