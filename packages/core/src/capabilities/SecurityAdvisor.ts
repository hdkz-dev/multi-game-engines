import { createI18nKey } from "../protocol/ProtocolValidator.js";
import { ISecurityStatus, EngineErrorCode } from "../types.js";
import { EngineError } from "../errors/EngineError.js";

/**
 * SRI検証やCOOP/COEPヘッダーの診断を提供します。
 */
export class SecurityAdvisor {
  /**
   * SRI文字列が有効な形式（W3C規格）かどうかを検証します。
   * マルチハッシュ形式をサポートします。
   */
  static isValidSRI(sri: string): boolean {
    if (!sri || typeof sri !== "string") return false;
    const hashes = sri.split(/\s+/);
    const pattern = /^(sha256|sha384|sha512)-[A-Za-z0-9+/=]+$/;
    return hashes.every((h) => pattern.test(h));
  }

  /**
   * 安全な fetch オプションを生成します。
   */
  static getSafeFetchOptions(sri?: string): RequestInit {
    if (!sri || !SecurityAdvisor.isValidSRI(sri)) return {};

    return {
      integrity: sri,
      mode: "cors",
      credentials: "omit",
    };
  }

  /**
   * W3C勧告に基づいたマルチハッシュSRI検証。
   * 最強のアルゴリズムを優先して検証します。
   */
  /**
   * SRI ハッシュを検証し、一致しない場合は例外をスローします。
   * Refuse by Exception 原則に基づく厳格な検証メソッドです。
   */
  static async assertSRI(data: ArrayBuffer, sri: string): Promise<void> {
    const isValid = await this.verifySRI(data, sri);
    if (!isValid) {
      const i18nKey = createI18nKey("engine.errors.sriMismatch");
      throw new EngineError({
        code: EngineErrorCode.SRI_MISMATCH,
        message: "SRI hash verification failed.",
        i18nKey,
      });
    }
  }

  static async verifySRI(data: ArrayBuffer, sri: string): Promise<boolean> {
    if (!SecurityAdvisor.isValidSRI(sri)) return false;

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

    // 2026 Best Practice: 最強アルゴリズムを特定
    let strongestLevel = 0;
    for (const hash of hashes) {
      const algo = hash.split("-")[0];
      if (algo) {
        const priority = algoPriority[algo];
        if (priority !== undefined && priority > strongestLevel) {
          strongestLevel = priority;
        }
      }
    }

    if (strongestLevel === 0) return false;

    // 最強レベルのハッシュのうち、いずれか一つにマッチすればOK
    for (const hash of hashes) {
      const [algo, expectedBase64] = hash.split("-") as [string, string];
      if (algoPriority[algo] !== strongestLevel) continue;

      const webCryptoAlgo = algoMap[algo];
      if (!webCryptoAlgo) continue;

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
  static async getStatus(): Promise<ISecurityStatus> {
    const isCrossOriginIsolated =
      typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;
    const missingHeaders: string[] = [];

    // 2026 Best Practice: ブラウザ環境でのみヘッダー診断を試行
    if (typeof window !== "undefined" && typeof fetch !== "undefined") {
      try {
        // 2026: 5s timeout for diagnostics fetch
        const response = await fetch(window.location.href, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });
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
      sriEnabled: sriSupported,
      coopCoepEnabled: isCrossOriginIsolated,
      missingHeaders: missingHeaders.length > 0 ? missingHeaders : undefined,
    };
  }

  /**
   * 2026 Zenith Tier: 隔離環境を有効化するための具体的なアドバイスを返します。
   */
  static getRemediationAdvice(): string {
    return `
To enable Multi-threading (SharedArrayBuffer), set the following HTTP headers:
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Embedder-Policy: require-corp

Platform examples:
[Vercel (vercel.json)]
{ "headers": [{ "source": "/(.*)", "headers": [
  { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
  { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
]}]}

[Cloudflare Pages (_headers)]
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp

[Netlify (_headers)]
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
`;
  }
}
