import {
  IEngineLoader,
  IEngineSourceConfig,
  IFileStorage,
  EngineErrorCode,
  I18nKey,
  ProgressCallback,
} from "../types.js";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor.js";
import { EngineError } from "../errors/EngineError.js";
import { SegmentedVerifier } from "../protocol/SegmentedVerifier.js";

/**
 * 2026 Zenith Tier: エンジンバイナリのダウンロード、SRI検証、ストレージ保存を管理するローダー。
 * UI/CLI 共通の進捗通知、中断、リトライ、再開機能を備える。
 */
export class EngineLoader implements IEngineLoader {
  private inflightLoads = new Map<string, Promise<string>>();
  private inflightBatchLoads = new Map<
    string,
    Promise<Record<string, string>>
  >();
  private activeBlobs = new Map<string, string>(); // cacheKey -> blobUrl
  private activeBlobsByUrl = new Map<string, string>(); // blobUrl -> cacheKey
  private isProduction: boolean;
  private disposed = false;

  constructor(private storage: IFileStorage) {
    const g = globalThis as unknown as {
      process?: { env?: Record<string, string> };
    };
    this.isProduction = g.process?.env?.["NODE_ENV"] === "production";
  }

  private getMimeType(config: IEngineSourceConfig): string {
    switch (config.type) {
      case "wasm":
        return "application/wasm";
      case "eval-data":
      case "native":
      case "webgpu-compute":
      case "asset":
      case "json":
      case "text":
        return "application/octet-stream";
      case "worker-js":
      default:
        return "application/javascript";
    }
  }

  /**
   * 単一のエンジンリソースをロードします。
   */
  async loadResource(
    engineId: string,
    config: IEngineSourceConfig,
    options?: { signal?: AbortSignal; onProgress?: ProgressCallback },
  ): Promise<string> {
    if (this.disposed) {
      throw new EngineError({
        code: EngineErrorCode.LIFECYCLE_ERROR,
        message: "EngineLoader has been disposed.",
        engineId,
        i18nKey: "engine.errors.disposed" as I18nKey,
      });
    }

    // 2026: 厳密な ID バリデーション
    if (/[^a-zA-Z0-9-_]/.test(engineId)) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Invalid engine ID: "${engineId}".`,
        engineId,
        i18nKey: "engine.errors.invalidEngineId" as I18nKey,
      });
    }

    const cacheKey = `${engineId}:${encodeURIComponent(config.url)}`;
    const activeUrl = this.activeBlobs.get(cacheKey);
    if (activeUrl) return activeUrl;

    const existing = this.inflightLoads.get(cacheKey);
    if (existing) return existing;

    const promise = (async () => {
      try {
        // 1. セキュリティ検証 (URL, Protocol)
        this.validateResourceUrl(config, engineId);

        // 2. キャッシュチェック
        const cached = await this.storage.get(cacheKey);
        if (cached) {
          options?.onProgress?.({
            status: "verifying",
            loadedBytes: cached.byteLength,
            totalBytes: cached.byteLength,
            percentage: 100,
            resource: config.url,
          });

          if (config.sri) {
            await SecurityAdvisor.assertSRI(cached, config.sri);
          }

          if (config.segmentedSri) {
            await SegmentedVerifier.assertSegmented(
              cached,
              config.segmentedSri,
            );
          }

          // SSR Guard
          if (
            typeof URL === "undefined" ||
            typeof URL.createObjectURL !== "function"
          ) {
            return config.url;
          }

          const blobUrl = URL.createObjectURL(
            new Blob([cached], { type: this.getMimeType(config) }),
          );
          this.updateBlobUrl(cacheKey, blobUrl);

          options?.onProgress?.({
            status: "completed",
            loadedBytes: cached.byteLength,
            totalBytes: cached.byteLength,
            percentage: 100,
            resource: config.url,
          });
          return blobUrl;
        }

        // 3. フェッチ (Retry & Progress 対応)
        const data = await this.fetchWithProgress(
          config.url,
          options?.onProgress,
          options?.signal,
        );

        // 4. SRI 検証
        options?.onProgress?.({
          status: "verifying",
          loadedBytes: data.byteLength,
          totalBytes: data.byteLength,
          resource: config.url,
        });
        if (config.sri) {
          try {
            await SecurityAdvisor.assertSRI(data, config.sri);
          } catch (err) {
            await this.storage.delete(cacheKey);
            throw err;
          }
        }

        if (config.segmentedSri) {
          try {
            await SegmentedVerifier.assertSegmented(data, config.segmentedSri);
          } catch (err) {
            await this.storage.delete(cacheKey);
            throw err;
          }
        }

        // 5. ストレージ保存と Blob URL 化
        await this.storage.set(cacheKey, data);

        // SSR Guard
        if (
          typeof URL === "undefined" ||
          typeof URL.createObjectURL !== "function"
        ) {
          return config.url;
        }

        const blobUrl = URL.createObjectURL(
          new Blob([data], { type: this.getMimeType(config) }),
        );
        this.updateBlobUrl(cacheKey, blobUrl);

        options?.onProgress?.({
          status: "completed",
          loadedBytes: data.byteLength,
          totalBytes: data.byteLength,
          percentage: 100,
          resource: config.url,
        });
        return blobUrl;
      } finally {
        this.inflightLoads.delete(cacheKey);
      }
    })();

    this.inflightLoads.set(cacheKey, promise);
    return promise;
  }

  /**
   * 進捗通知・リトライ・レジューム付きのフェッチ。
   */
  private async fetchWithProgress(
    url: string,
    onProgress?: ProgressCallback,
    signal?: AbortSignal,
  ): Promise<ArrayBuffer> {
    let lastError: Error | undefined;
    let loadedBytes = 0;
    const chunks: Uint8Array[] = [];

    // 2026: 指数バックオフ付きリトライ (Max 3 times)
    for (let attempt = 0; attempt < 3; attempt++) {
      if (signal?.aborted) {
        throw new EngineError({
          code: EngineErrorCode.CANCELLED,
          message: "Fetch aborted",
        });
      }

      try {
        onProgress?.({ status: "connecting", loadedBytes, resource: url });

        const headers: Record<string, string> = {};
        if (loadedBytes > 0) {
          // 2026: Resumable Fetch (Range Request)
          headers["Range"] = `bytes=${loadedBytes}-`;
        }

        const response = await fetch(url, { signal: signal ?? null, headers });

        // 206 Partial Content または 200 OK
        if (!response.ok && response.status !== 206) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const isPartial = response.status === 206;
        const contentLength = parseInt(
          response.headers.get("Content-Length") || "0",
          10,
        );
        const totalBytes = isPartial
          ? parseInt(
              response.headers.get("Content-Range")?.split("/")?.[1] || "0",
              10,
            ) || undefined
          : contentLength || undefined;

        const reader = response.body?.getReader();

        if (!reader) {
          const data = await response.arrayBuffer();
          return data;
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value) {
            chunks.push(value);
            loadedBytes += value.length;

            onProgress?.({
              status: "downloading",
              loadedBytes,
              totalBytes,
              percentage: totalBytes
                ? Math.floor((loadedBytes / totalBytes) * 100)
                : undefined,
              resource: url,
            });
          }
        }

        // 2026: データ整合性チェック (Incomplete Data Check)
        if (
          totalBytes !== undefined &&
          !isPartial &&
          loadedBytes !== totalBytes
        ) {
          throw new Error(
            `Incomplete data: expected ${totalBytes} bytes, got ${loadedBytes}`,
          );
        }

        const result = new Uint8Array(loadedBytes);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        return result.buffer as ArrayBuffer;
      } catch (err) {
        lastError = err as Error;
        if (
          err instanceof Error &&
          (err.name === "AbortError" || err.message.includes("aborted"))
        ) {
          throw err;
        }

        if (attempt < 2) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new EngineError({
      code: EngineErrorCode.NETWORK_ERROR,
      message: `Failed to fetch after retries: ${lastError?.message}`,
      originalError: lastError,
    });
  }

  private validateResourceUrl(
    config: IEngineSourceConfig,
    engineId: string,
  ): void {
    const url = config.url;
    // 2026: Insecure Connection Check
    if (
      url.startsWith("http:") &&
      this.isProduction &&
      !url.includes("localhost") &&
      !url.includes("127.0.0.1")
    ) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: "Insecure connection (HTTP) is not allowed in production.",
        engineId,
        i18nKey: "engine.errors.insecureConnection" as I18nKey,
      });
    }

    // SRI Check
    if (!config.sri && !config.__unsafeNoSRI) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: "SRI hash is required for all engine resources.",
        engineId,
        i18nKey: "engine.errors.sriRequired" as I18nKey,
      });
    }

    if (config.__unsafeNoSRI && this.isProduction) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: "SRI bypass (__unsafeNoSRI) is not allowed in production.",
        engineId,
        i18nKey: "engine.errors.sriBypassNotAllowed" as I18nKey,
      });
    }
  }

  async loadResources(
    engineId: string,
    configs: Record<string, IEngineSourceConfig>,
    options?: { signal?: AbortSignal; onProgress?: ProgressCallback },
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const entries = Object.entries(configs);

    // 2026: アトミック一括ロード (一部失敗でロールバック)
    const preExistingUrls = new Set(this.activeBlobs.values());

    try {
      await Promise.all(
        entries.map(async ([key, config]) => {
          results[key] = await this.loadResource(engineId, config, options);
        }),
      );
      return results;
    } catch (err) {
      // ロールバック: 新しく生成された Blob URL を破棄
      for (const url of Object.values(results)) {
        if (!preExistingUrls.has(url)) {
          this.revoke(url);
        }
      }
      throw err;
    }
  }

  private updateBlobUrl(cacheKey: string, newUrl: string): void {
    if (this.disposed) {
      URL.revokeObjectURL(newUrl);
      return;
    }
    const oldUrl = this.activeBlobs.get(cacheKey);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
      this.activeBlobsByUrl.delete(oldUrl);
    }
    this.activeBlobs.set(cacheKey, newUrl);
    this.activeBlobsByUrl.set(newUrl, cacheKey);
  }

  revoke(url: string): void {
    const cacheKey = this.activeBlobsByUrl.get(url);
    if (cacheKey) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(`[EngineLoader] Failed to revoke URL ${url}:`, err);
      }
      this.activeBlobs.delete(cacheKey);
      this.activeBlobsByUrl.delete(url);
    }
  }

  revokeAll(): void {
    this.disposed = true;
    for (const url of this.activeBlobs.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore
      }
    }
    this.activeBlobs.clear();
    this.activeBlobsByUrl.clear();
    this.inflightLoads.clear();
    this.inflightBatchLoads.clear();
  }

  revokeByEngineId(engineId: string): void {
    for (const [key, val] of this.activeBlobs.entries()) {
      if (key.startsWith(`${engineId}:`)) {
        try {
          URL.revokeObjectURL(val);
        } catch {
          // Ignore
        }
        this.activeBlobs.delete(key);
        this.activeBlobsByUrl.delete(val);
      }
    }
  }
}
