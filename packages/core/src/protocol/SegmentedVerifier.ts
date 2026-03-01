import { createI18nKey } from "./ProtocolValidator.js";
import { ISegmentedSRI, EngineErrorCode, I18nKey } from "../types.js";
import { EngineError } from "../errors/EngineError.js";

/**
 * 2026 Zenith Tier: 分割された SRI ハッシュの検証を行うユーティリティ。
 * 巨大なファイルのダウンロード中にインクリメンタルな検証を可能にします。
 */
export class SegmentedVerifier {
  /**
   * チャンク（セグメント）ごとのハッシュを検証します。
   */
  public static async verifySegment(
    data: Uint8Array,
    expectedHash: string,
  ): Promise<boolean> {
    const [algo, expectedBase64] = expectedHash.split("-") as [string, string];

    let webCryptoAlgo = "";
    if (algo === "sha256") webCryptoAlgo = "SHA-256";
    else if (algo === "sha384") webCryptoAlgo = "SHA-384";
    else if (algo === "sha512") webCryptoAlgo = "SHA-512";
    else return false;

    // 2026: Ensure we are passing a compatible buffer to subtle crypto
    const digest = await crypto.subtle.digest(
      webCryptoAlgo,
      data as BufferSource,
    );
    const actualBase64 = btoa(String.fromCharCode(...new Uint8Array(digest)));

    return actualBase64 === expectedBase64;
  }

  /**
   * ストリーム読み込み中にインクリメンタルに検証を行います。
   */
  public static async assertSegmented(
    fullData: ArrayBuffer,
    segmentedSri: ISegmentedSRI,
  ): Promise<void> {
    const { segmentSize, hashes } = segmentedSri;
    const bytes = new Uint8Array(fullData);

    for (let i = 0; i < hashes.length; i++) {
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize, bytes.length);
      const segment = bytes.slice(start, end);

      const isValid = await this.verifySegment(segment, hashes[i]!);
      if (!isValid) {
        const i18nKey = createI18nKey("engine.errors.sriMismatch");
        throw new EngineError({
          code: EngineErrorCode.SRI_MISMATCH,
          message: `Segmented SRI verification failed at segment ${i}.`,
          i18nKey,
        });
      }
    }
  }
}
