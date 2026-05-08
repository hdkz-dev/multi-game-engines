import { IFileStorage, ISegmentedSRI, ProgressCallback } from "../types.js";

/** HTTP Range リクエストによるチャンクダウンロードのオプション */
export interface ChunkedDownloadOptions {
  /** SRI ハッシュ (sha256-/sha384-/sha512- プレフィックス形式) */
  sri?: string | undefined;
  /** セグメント単位 SRI ハッシュ設定 (IEngineSourceConfig.segmentedSri と同形式) */
  segmentedSri?: ISegmentedSRI | undefined;
  /** チャンクサイズ (bytes)。デフォルト 4 MiB。 */
  chunkSize?: number | undefined;
  /** 進捗コールバック (loadedBytes, totalBytes?) */
  onProgress?: ProgressCallback | undefined;
  /** ダウンロード中断用シグナル */
  signal?: AbortSignal | undefined;
  /** ストレージキャッシュ (存在すればキャッシュから返す・完了後に書き込む) */
  storage?: IFileStorage | undefined;
}

/** `ChunkedDownloader.download()` の返値 */
export interface ChunkedDownloadResult {
  /** ダウンロードされたデータ */
  buffer: ArrayBuffer;
  /** 実際に転送されたバイト数 (キャッシュヒット時は 0) */
  transferredBytes: number;
  /** OPFS / storage キャッシュから返されたかどうか */
  fromCache: boolean;
}

/**
 * 2026 Zenith Tier — HTTP Range リクエスト対応チャンクダウンローダー。
 *
 * 巨大ファイル（100 MiB 超）を一定チャンクサイズで分割取得し、
 * 進捗報告・中断・SRI 検証・ストレージキャッシュ統合を提供します。
 *
 * サーバーが Range リクエストをサポートしない場合は通常 fetch にフォールバックします。
 */
export class ChunkedDownloader {
  /** デフォルトチャンクサイズ: 4 MiB */
  static readonly DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024;

  /**
   * 指定 URL からデータをダウンロードします。
   *
   * @param url  ダウンロード対象の URL
   * @param options  進捗・SRI・キャッシュ等のオプション
   */
  async download(
    url: string,
    options: ChunkedDownloadOptions = {},
  ): Promise<ChunkedDownloadResult> {
    const {
      sri,
      segmentedSri,
      chunkSize = ChunkedDownloader.DEFAULT_CHUNK_SIZE,
      onProgress,
      signal,
      storage,
    } = options;

    // ---- キャッシュ確認 ----
    if (storage && sri) {
      const cacheKey = this.cacheKey(url, sri);
      const cached = await storage.get(cacheKey).catch(() => null);
      if (cached) {
        onProgress?.({
          status: "completed",
          loadedBytes: cached.byteLength,
          totalBytes: cached.byteLength,
          percentage: 100,
          resource: url,
        });
        return { buffer: cached, transferredBytes: 0, fromCache: true };
      }
    }

    // ---- HEAD リクエストでサーバー能力を確認 ----
    const { acceptsRanges, totalBytes } = await this.probe(url, signal);

    let buffer: ArrayBuffer;

    if (acceptsRanges && totalBytes !== null && totalBytes > chunkSize) {
      // ---- チャンクダウンロード ----
      buffer = await this.downloadChunked(
        url,
        totalBytes,
        chunkSize,
        segmentedSri,
        onProgress,
        signal,
      );
    } else {
      // ---- フォールバック: 単一 fetch ----
      buffer = await this.downloadSingle(url, totalBytes, onProgress, signal);
    }

    // ---- 全体 SRI 検証 ----
    if (sri) {
      await this.verifySri(buffer, sri, url);
    }

    // ---- キャッシュへ書き込み ----
    if (storage && sri) {
      await storage.set(this.cacheKey(url, sri), buffer).catch(() => {
        // キャッシュ書き込み失敗はダウンロード成功を妨げない
      });
    }

    return {
      buffer,
      transferredBytes: buffer.byteLength,
      fromCache: false,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** HEAD リクエストでサーバー能力を確認します */
  private async probe(
    url: string,
    signal?: AbortSignal,
  ): Promise<{ acceptsRanges: boolean; totalBytes: number | null }> {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        ...(signal != null && { signal }),
      });
      const acceptsRanges = res.headers.get("accept-ranges") === "bytes";
      const cl = res.headers.get("content-length");
      const totalBytes = cl ? parseInt(cl, 10) : null;
      return { acceptsRanges, totalBytes };
    } catch {
      // HEAD に失敗した場合 (CORS など) はフォールバックさせる
      return { acceptsRanges: false, totalBytes: null };
    }
  }

  /** Range リクエストによるチャンクダウンロード */
  private async downloadChunked(
    url: string,
    totalBytes: number,
    chunkSize: number,
    segmentedSri: ISegmentedSRI | undefined,
    onProgress: ProgressCallback | undefined,
    signal: AbortSignal | undefined,
  ): Promise<ArrayBuffer> {
    const result = new Uint8Array(totalBytes);
    let offset = 0;
    let chunkIdx = 0;

    onProgress?.({
      status: "downloading",
      loadedBytes: 0,
      totalBytes,
      percentage: 0,
      resource: url,
    });

    while (offset < totalBytes) {
      signal?.throwIfAborted();

      const end = Math.min(offset + chunkSize - 1, totalBytes - 1);
      const res = await fetch(url, {
        headers: { Range: `bytes=${offset}-${end}` },
        ...(signal != null && { signal }),
      });

      // 206 Partial Content または 200 OK を許容
      if (!res.ok && res.status !== 206) {
        throw new ChunkedDownloadError(
          `Range request failed with HTTP ${res.status}: ${url}`,
          url,
        );
      }

      const chunk = new Uint8Array(await res.arrayBuffer());
      result.set(chunk, offset);

      // セグメント単位の SRI 検証
      if (segmentedSri && chunkIdx < segmentedSri.hashes.length) {
        await this.verifySri(chunk.buffer, segmentedSri.hashes[chunkIdx]!, url);
      }

      offset += chunk.byteLength;
      chunkIdx++;

      const pct = Math.round((offset / totalBytes) * 100);
      onProgress?.({
        status: offset >= totalBytes ? "completed" : "downloading",
        loadedBytes: offset,
        totalBytes,
        percentage: pct,
        resource: url,
      });
    }

    return result.buffer;
  }

  /** 通常の単一 fetch（フォールバック） */
  private async downloadSingle(
    url: string,
    totalBytes: number | null,
    onProgress: ProgressCallback | undefined,
    signal: AbortSignal | undefined,
  ): Promise<ArrayBuffer> {
    onProgress?.({
      status: "downloading",
      loadedBytes: 0,
      ...(totalBytes != null && { totalBytes }),
      percentage: 0,
      resource: url,
    });

    const res = await fetch(url, {
      ...(signal != null && { signal }),
    });
    if (!res.ok) {
      throw new ChunkedDownloadError(
        `Fetch failed with HTTP ${res.status}: ${url}`,
        url,
      );
    }

    const buffer = await res.arrayBuffer();

    onProgress?.({
      status: "completed",
      loadedBytes: buffer.byteLength,
      totalBytes: buffer.byteLength,
      percentage: 100,
      resource: url,
    });

    return buffer;
  }

  /** SRI ハッシュを検証します (sha256/sha384/sha512) */
  private async verifySri(
    buffer: ArrayBuffer,
    sri: string,
    url: string,
  ): Promise<void> {
    const match = /^sha(256|384|512)-(.+)$/.exec(sri);
    if (!match) {
      throw new ChunkedDownloadError(`Invalid SRI format: ${sri}`, url);
    }

    const algo = `SHA-${match[1]}`;
    const expected = match[2]!;

    const digest = await crypto.subtle.digest(algo, buffer);
    // バイト列を Base64 に変換
    const actual = btoa(
      Array.from(new Uint8Array(digest))
        .map((b) => String.fromCharCode(b))
        .join(""),
    );

    if (actual !== expected) {
      throw new ChunkedDownloadError(
        `SRI verification failed for ${url} (expected ${sri})`,
        url,
      );
    }
  }

  /**
   * URL と SRI からストレージキャッシュキーを生成します。
   * SRI の先頭 20 文字 + URL 末尾 40 文字で衝突しにくいキーを生成します。
   */
  cacheKey(url: string, sri: string): string {
    return `chunked:${sri.slice(0, 20)}:${url.slice(-40)}`;
  }
}

/** チャンクダウンロード固有のエラー */
export class ChunkedDownloadError extends Error {
  constructor(
    message: string,
    public readonly url: string,
  ) {
    super(message);
    this.name = "ChunkedDownloadError";
  }
}
