import {
  IEngineLoader,
  IEngineSourceConfig,
  IFileStorage,
  EngineErrorCode,
} from "../types.js";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor.js";
import { EngineError } from "../errors/EngineError.js";

/**
 * エンジンバイナリのダウンロード、SRI検証、ストレージ保存を管理するローダー。
 */
export class EngineLoader implements IEngineLoader {
  private inflightLoads = new Map<string, Promise<string>>();
  private activeBlobs = new Map<string, string>(); // cacheKey -> blobUrl
  private isProduction: boolean;

  constructor(private storage: IFileStorage) {
    this.isProduction =
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] === "production";
  }

  private getMimeType(config: IEngineSourceConfig): string {
    switch (config.type) {
      case "wasm":
        return "application/wasm";
      case "eval-data":
      case "native":
      case "webgpu-compute":
      case "asset":
        return "application/octet-stream";
      case "worker-js":
      default:
        return "application/javascript";
    }
  }

  async loadResource(
    engineId: string,
    config: IEngineSourceConfig,
  ): Promise<string> {
    // Path Traversal 対策: ID をサニタイズ
    const safeId = engineId.replace(/[^a-zA-Z0-9-_]/g, "");
    const cacheKey = `${safeId}_${config.url}`;

    // 2026 Best Practice: アトミックロック (Promise を先に Map に入れてから非同期実行)
    const existing = this.inflightLoads.get(cacheKey);
    if (existing) return existing;

    const promise = (async () => {
      try {
        // 2026 Best Practice: 実行リソース（Worker/WASM/Script）のオリジン検証
        // type が明示的に安全（json, css 等）でない限り、デフォルトで検証対象とする。
        if (
          config.type === "worker-js" ||
          config.type === "wasm" ||
          config.type === undefined || // Default to JS
          (config.type as string).includes("script") ||
          (config.type as string).includes("javascript")
        ) {
          this.validateWorkerUrl(config.url, engineId);
        }

        // 2026 Best Practice: HTTPS 強制 (Strict Loopback Check)
        const url = new URL(config.url, window.location.href);
        const isLoopback =
          url.hostname === "localhost" ||
          url.hostname === "127.0.0.1" ||
          url.hostname === "::1";

        if (url.protocol === "http:" && !isLoopback) {
          throw new EngineError({
            code: EngineErrorCode.SECURITY_ERROR,
            message:
              "Insecure connection (HTTP) is not allowed for sensitive engine files.",
            engineId,
            remediation: "Use HTTPS for all engine resource URLs.",
          });
        }

        const sri = config.sri;
        const unsafeNoSRI = config.__unsafeNoSRI === true;

        if (!sri && !unsafeNoSRI) {
          throw new EngineError({
            code: EngineErrorCode.SRI_MISMATCH,
            message: "SRI required for security verification.",
            engineId,
          });
        }

        if (unsafeNoSRI && this.isProduction) {
          throw new EngineError({
            code: EngineErrorCode.SECURITY_ERROR,
            message:
              "SRI bypass (__unsafeNoSRI) is not allowed in production environment.",
            engineId,
            remediation: "Provide a valid SRI hash for all engine resources.",
          });
        }

        const cached = await this.storage.get(cacheKey);
        if (cached) {
          if (sri) {
            const isValid = await SecurityAdvisor.verifySRI(cached, sri);
            if (isValid) {
              const cachedBlobUrl = URL.createObjectURL(
                new Blob([cached], { type: this.getMimeType(config) }),
              );
              this.updateBlobUrl(cacheKey, cachedBlobUrl);
              return cachedBlobUrl;
            }
            await this.storage.delete(cacheKey);
          } else if (config.__unsafeNoSRI) {
            // 2026: 非本番環境かつ SRI バイパス時はキャッシュをそのまま使用可能
            const bypassBlobUrl = URL.createObjectURL(
              new Blob([cached], { type: this.getMimeType(config) }),
            );
            this.updateBlobUrl(cacheKey, bypassBlobUrl);
            return bypassBlobUrl;
          }
        }

        let data: ArrayBuffer;
        try {
          const response = await fetch(config.url);
          if (!response.ok) {
            throw new EngineError({
              code: EngineErrorCode.NETWORK_ERROR,
              message: `Failed to fetch engine: ${response.statusText} (${response.status})`,
              engineId,
            });
          }
          data = await response.arrayBuffer();
        } catch (err) {
          if (err instanceof EngineError) throw err;
          throw new EngineError({
            code: EngineErrorCode.NETWORK_ERROR,
            message: `Network error while fetching engine resource: ${config.url}`,
            engineId,
            originalError: err,
          });
        }

        if (sri) {
          const isValid = await SecurityAdvisor.verifySRI(data, sri);
          if (!isValid) {
            throw new EngineError({
              code: EngineErrorCode.SRI_MISMATCH,
              message: "SRI Mismatch",
              engineId,
            });
          }
        }

        await this.storage.set(cacheKey, data);
        const blob = new Blob([data], { type: this.getMimeType(config) });
        const blobUrl = URL.createObjectURL(blob);
        this.updateBlobUrl(cacheKey, blobUrl);
        return blobUrl;
      } finally {
        // 2026 Best Practice: 完了または失敗時に Map から除去し、再試行を可能にする
        this.inflightLoads.delete(cacheKey);
      }
    })();

    this.inflightLoads.set(cacheKey, promise);
    return promise;
  }

  private updateBlobUrl(cacheKey: string, newUrl: string): void {
    const oldUrl = this.activeBlobs.get(cacheKey);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }
    this.activeBlobs.set(cacheKey, newUrl);
  }

  async loadResources(
    engineId: string,
    configs: Record<string, IEngineSourceConfig>,
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const entries = Object.entries(configs);

    // 2026 Best Practice: Promise.allSettled を使用して部分的な失敗時のリークを防止
    const settledResults = await Promise.allSettled(
      entries.map(async ([key, config]) => {
        const url = await this.loadResource(engineId, config);
        return { key, url };
      }),
    );

    const failures = settledResults.filter(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult[];
    if (failures.length > 0) {
      // ロールバック: 成功した分の URL を revoke する
      for (const res of settledResults) {
        if (res.status === "fulfilled") {
          this.revoke(res.value.url);
        }
      }
      const firstFailure = failures[0];
      if (firstFailure) {
        throw firstFailure.reason;
      }
      throw new Error("Unknown error during resource loading");
    }

    for (const res of settledResults) {
      if (res.status === "fulfilled") {
        results[res.value.key] = res.value.url;
      }
    }

    return results;
  }

  revoke(url: string): void {
    URL.revokeObjectURL(url);
    // マップからも削除
    for (const [key, val] of this.activeBlobs.entries()) {
      if (val === url) {
        this.activeBlobs.delete(key);
        break;
      }
    }
  }

  /**
   * 2026 Best Practice: Worker 実行コンテキストのオリジン検証
   */
  private validateWorkerUrl(url: string, engineId?: string): void {
    if (url.startsWith("blob:")) return;
    try {
      const parsedUrl = new URL(url, window.location.href);
      const isLoopback =
        parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1" ||
        parsedUrl.hostname === "::1";

      // 本番環境ではループバックも禁止（開発者モードの混入を防ぐ）
      if (this.isProduction && isLoopback) {
        throw new EngineError({
          code: EngineErrorCode.SECURITY_ERROR,
          message: `Loopback resources are prohibited in production: ${url}`,
          engineId,
        });
      }

      if (parsedUrl.origin !== window.location.origin && !isLoopback) {
        throw new EngineError({
          code: EngineErrorCode.SECURITY_ERROR,
          message: `Cross-origin Worker scripts are prohibited for security: ${url}`,
          engineId,
          remediation:
            "Host the engine worker script on the same origin or use a Blob URL via EngineLoader.",
        });
      }
    } catch (e) {
      if (e instanceof EngineError) throw e;
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Invalid resource URL: ${url}`,
        engineId,
      });
    }
  }
}
