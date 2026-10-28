import { resourceCacheKey } from "./ResourceCacheKey.js";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor.js";
import { EngineError } from "../errors/EngineError.js";
import {
  EngineErrorCode,
  IFileStorage,
  ISegmentedSRI,
  ProgressCallback,
} from "../types.js";

/** HTTP Range リクエストによるチャンクダウンロードのオプション */
export interface ChunkedDownloadOptions {
  /** SRI ハッシュ (sha256-/sha384-/sha512- プレフィックス形式) */
  sri: string;
  /** セグメント単位 SRI ハッシュ設定 (IEngineSourceConfig.segmentedSri と同形式) */
  segmentedSri?: ISegmentedSRI | undefined;
  /** チャンクサイズ (bytes)。デフォルト 4 MiB。 */
  chunkSize?: number | undefined;
  /** 最大応答サイズ (bytes)。デフォルト 512 MiB。 */
  maxBytes?: number | undefined;
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
  static readonly DEFAULT_MAX_BYTES = 512 * 1024 * 1024;

  /**
   * 指定 URL からデータをダウンロードします。
   *
   * @param url - ダウンロード対象の URL
   * @param options - 進捗・SRI・キャッシュ等のオプション
   */
  async download(
    url: string,
    options: ChunkedDownloadOptions,
  ): Promise<ChunkedDownloadResult> {
    SecurityAdvisor.validateResourceUrl(url);
    options?.signal?.throwIfAborted();
    if (!options?.sri) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: "SRI is required",
      });
    }
    const {
      sri,
      segmentedSri,
      chunkSize = segmentedSri?.segmentSize ??
        ChunkedDownloader.DEFAULT_CHUNK_SIZE,
      maxBytes = ChunkedDownloader.DEFAULT_MAX_BYTES,
      onProgress,
      signal,
      storage,
    } = options;

    if (!SecurityAdvisor.isValidSRI(sri)) {
      throw new ChunkedDownloadError(`Invalid SRI format: ${sri}`, url);
    }
    if (
      !Number.isSafeInteger(chunkSize) ||
      chunkSize <= 0 ||
      !Number.isSafeInteger(maxBytes) ||
      maxBytes <= 0
    ) {
      throw new ChunkedDownloadError("Invalid download size limit", url);
    }
    if (
      segmentedSri &&
      (segmentedSri.segmentSize !== chunkSize ||
        segmentedSri.hashes.length === 0 ||
        segmentedSri.hashes.some((hash) => !SecurityAdvisor.isValidSRI(hash)))
    ) {
      throw new ChunkedDownloadError(
        "Invalid segmented SRI configuration",
        url,
      );
    }

    // ---- キャッシュ確認 ----
    if (storage) {
      const cacheKey = await this.cacheKey(url, sri);
      const cached = await storage.get(cacheKey).catch(() => null);
      if (cached) {
        signal?.throwIfAborted();
        this.validateLength(cached.byteLength, maxBytes, url);
        await this.verifyBuffer(cached, sri, segmentedSri, chunkSize, url);
        signal?.throwIfAborted();
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
    if (totalBytes !== null) this.validateLength(totalBytes, maxBytes, url);
    if (
      segmentedSri &&
      totalBytes !== null &&
      segmentedSri.hashes.length !== Math.ceil(totalBytes / chunkSize)
    ) {
      throw new ChunkedDownloadError(
        "Segment hash count does not match resource size",
        url,
      );
    }

    let buffer: ArrayBuffer;

    if (acceptsRanges && totalBytes !== null && totalBytes > chunkSize) {
      // ---- チャンクダウンロード ----
      buffer = await this.downloadChunked(
        url,
        totalBytes,
        chunkSize,
        onProgress,
        signal,
      );
    } else {
      // ---- フォールバック: 単一 fetch ----
      buffer = await this.downloadSingle(
        url,
        totalBytes,
        maxBytes,
        onProgress,
        signal,
      );
    }

    // ---- 全体 SRI 検証 ----
    await this.verifyBuffer(buffer, sri, segmentedSri, chunkSize, url);
    signal?.throwIfAborted();

    // ---- キャッシュへ書き込み ----
    if (storage) {
      await storage.set(await this.cacheKey(url, sri), buffer).catch(() => {
        // キャッシュ書き込み失敗はダウンロード成功を妨げない
      });
    }

    signal?.throwIfAborted();
    onProgress?.({
      status: "completed",
      loadedBytes: buffer.byteLength,
      totalBytes: buffer.byteLength,
      percentage: 100,
      resource: url,
    });
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
      const res = await SecurityAdvisor.safeFetch(url, {
        credentials: "omit",
        redirect: "error",
        method: "HEAD",
        ...(signal != null && { signal }),
      });
      if (!res.ok) return { acceptsRanges: false, totalBytes: null };
      const encoding = res.headers.get("content-encoding");
      if (encoding && encoding !== "identity")
        return { acceptsRanges: false, totalBytes: null };
      const acceptsRanges = res.headers.get("accept-ranges") === "bytes";
      const totalBytes = this.contentLength(res, url);
      return { acceptsRanges, totalBytes };
    } catch (error: unknown) {
      signal?.throwIfAborted();
      if (
        error instanceof EngineError &&
        error.code === EngineErrorCode.SECURITY_ERROR
      ) {
        throw error;
      }
      if (error instanceof ChunkedDownloadError) throw error;
      // HEAD に失敗した場合 (CORS など) はフォールバックさせる
      return { acceptsRanges: false, totalBytes: null };
    }
  }

  /** Range リクエストによるチャンクダウンロード */
  private async downloadChunked(
    url: string,
    totalBytes: number,
    chunkSize: number,
    onProgress: ProgressCallback | undefined,
    signal: AbortSignal | undefined,
  ): Promise<ArrayBuffer> {
    const result = new Uint8Array(totalBytes);
    let offset = 0;

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
      const res = await SecurityAdvisor.safeFetch(url, {
        credentials: "omit",
        redirect: "error",
        headers: { Range: `bytes=${offset}-${end}` },
        ...(signal != null && { signal }),
      });

      if (res.status !== 206) {
        throw new ChunkedDownloadError(
          `Range request failed with HTTP ${res.status}: ${url}`,
          url,
        );
      }

      const expectedLength = end - offset + 1;
      const encoding = res.headers.get("content-encoding");
      if (
        (encoding && encoding !== "identity") ||
        res.headers.get("content-range") !==
          `bytes ${offset}-${end}/${totalBytes}`
      ) {
        throw new ChunkedDownloadError(
          "Invalid Content-Range or encoding",
          url,
        );
      }
      const declaredLength = this.contentLength(res, url);
      if (declaredLength !== null && declaredLength !== expectedLength) {
        throw new ChunkedDownloadError("Invalid chunk Content-Length", url);
      }
      const chunk = new Uint8Array(
        await this.readBody(res, expectedLength, url, signal),
      );
      if (chunk.byteLength !== expectedLength) {
        throw new ChunkedDownloadError("Invalid chunk length", url);
      }
      result.set(chunk, offset);

      offset += chunk.byteLength;

      const pct = Math.round((offset / totalBytes) * 100);
      onProgress?.({
        status: "downloading",
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
    maxBytes: number,
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

    const res = await SecurityAdvisor.safeFetch(url, {
      credentials: "omit",
      redirect: "error",
      ...(signal != null && { signal }),
    });
    if (res.status !== 200) {
      throw new ChunkedDownloadError(
        `Fetch failed with HTTP ${res.status}: ${url}`,
        url,
      );
    }

    const encoding = res.headers.get("content-encoding");
    const declaredLength =
      encoding && encoding !== "identity" ? null : this.contentLength(res, url);
    if (declaredLength !== null)
      this.validateLength(declaredLength, maxBytes, url);
    const buffer = await this.readBody(
      res,
      Math.min(totalBytes ?? maxBytes, declaredLength ?? maxBytes, maxBytes),
      url,
      signal,
    );
    if (
      (totalBytes !== null && buffer.byteLength !== totalBytes) ||
      (declaredLength !== null && buffer.byteLength !== declaredLength)
    ) {
      throw new ChunkedDownloadError("Response length mismatch", url);
    }

    return buffer;
  }

  private async verifyBuffer(
    buffer: ArrayBuffer,
    sri: string,
    segmentedSri: ISegmentedSRI | undefined,
    chunkSize: number,
    url: string,
  ): Promise<void> {
    await this.verifySri(buffer, sri, url);
    if (segmentedSri) {
      if (
        segmentedSri.hashes.length !== Math.ceil(buffer.byteLength / chunkSize)
      ) {
        throw new ChunkedDownloadError(
          "Segment hash count does not match resource size",
          url,
        );
      }
      for (let index = 0; index < segmentedSri.hashes.length; index++) {
        await this.verifySri(
          buffer.slice(index * chunkSize, (index + 1) * chunkSize),
          segmentedSri.hashes[index]!,
          url,
        );
      }
    }
  }

  /** SRI ハッシュを検証します (sha256/sha384/sha512) */
  private async verifySri(
    buffer: ArrayBuffer,
    sri: string,
    url: string,
  ): Promise<void> {
    if (!(await SecurityAdvisor.verifySRI(buffer, sri))) {
      throw new ChunkedDownloadError(`SRI verification failed for ${url}`, url);
    }
  }

  private validateLength(length: number, limit: number, url: string): void {
    if (!Number.isSafeInteger(length) || length < 0 || length > limit) {
      throw new ChunkedDownloadError("Response exceeds size limit", url);
    }
  }

  private contentLength(response: Response, url: string): number | null {
    const value = response.headers.get("content-length");
    if (value === null) return null;
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      throw new ChunkedDownloadError("Invalid Content-Length", url);
    }
    return Number(value);
  }

  private async readBody(
    response: Response,
    limit: number,
    url: string,
    signal?: AbortSignal,
  ): Promise<ArrayBuffer> {
    if (!response.body) {
      const buffer = await response.arrayBuffer();
      signal?.throwIfAborted();
      this.validateLength(buffer.byteLength, limit, url);
      return buffer;
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    const abort = (): void => {
      void reader.cancel(signal?.reason).catch(() => undefined);
    };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      while (true) {
        signal?.throwIfAborted();
        const { done, value } = await reader.read();
        signal?.throwIfAborted();
        if (done) break;
        length += value.byteLength;
        this.validateLength(length, limit, url);
        chunks.push(value);
      }
      const buffer = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return buffer.buffer;
    } finally {
      signal?.removeEventListener("abort", abort);
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }

  /**
   * URL と SRI からストレージキャッシュキーを生成します。
   * URL と SRI の全体を含め、異なるリソースやハッシュを分離します。
   */
  async cacheKey(url: string, sri: string): Promise<string> {
    return `chunked:${await resourceCacheKey(url, sri)}`;
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
