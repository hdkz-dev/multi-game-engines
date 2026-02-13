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

  constructor(private storage: IFileStorage) {}

  private getMimeType(config: IEngineSourceConfig): string {
    switch (config.type) {
      case "wasm":
        return "application/wasm";
      case "eval-data":
      case "native":
      case "webgpu-compute":
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
    const cacheKey = `${engineId}_${config.url}`;

    // 2026 Best Practice: アトミックロック (Promise を先に Map に入れてから非同期実行)
    const existing = this.inflightLoads.get(cacheKey);
    if (existing) return existing;

    const promise = (async () => {
      try {
        // 2026 Best Practice: HTTPS 強制 (Security Alert 対応)
        if (config.url.startsWith("http://")) {
          throw new EngineError({
            code: EngineErrorCode.SECURITY_ERROR,
            message:
              "Insecure connection (HTTP) is not allowed for sensitive engine files.",
            engineId,
            remediation: "Use HTTPS for all engine resource URLs.",
          });
        }

        if (!config.sri) {
          throw new EngineError({
            code: EngineErrorCode.SRI_MISMATCH,
            message: "SRI required for security verification.",
            engineId,
          });
        }

        const cached = await this.storage.get(cacheKey);
        if (cached) {
          const isValid = await SecurityAdvisor.verifySRI(cached, config.sri);
          if (isValid) {
            const url = URL.createObjectURL(
              new Blob([cached], { type: this.getMimeType(config) }),
            );
            this.updateBlobUrl(cacheKey, url);
            return url;
          }
          await this.storage.delete(cacheKey);
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

        const isValid = await SecurityAdvisor.verifySRI(data, config.sri);
        if (!isValid) {
          throw new EngineError({
            code: EngineErrorCode.SRI_MISMATCH,
            message: "SRI Mismatch",
            engineId,
          });
        }

        await this.storage.set(cacheKey, data);
        const url = URL.createObjectURL(
          new Blob([data], { type: this.getMimeType(config) }),
        );
        this.updateBlobUrl(cacheKey, url);
        return url;
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
      throw failures[0].reason;
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
}
