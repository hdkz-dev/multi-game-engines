import { IEngineLoader, IEngineSourceConfig, IFileStorage, EngineErrorCode } from "../types.js";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor.js";
import { EngineError } from "../errors/EngineError.js";

/**
 * エンジンバイナリのダウンロード、SRI検証、ストレージ保存を管理するローダー。
 */
export class EngineLoader implements IEngineLoader {
  private inflightLoads = new Map<string, Promise<string>>();
  private activeBlobs = new Map<string, string>(); // cacheKey -> blobUrl

  constructor(private storage: IFileStorage) {}

  async loadResource(engineId: string, config: IEngineSourceConfig): Promise<string> {
    const cacheKey = `${engineId}_${config.url}`;
    
    // アトミックロック: 同時に同じリソースをロードしない
    const existing = this.inflightLoads.get(cacheKey);
    if (existing) return existing;

    const promise = (async () => {
      if (!config.sri) {
        throw new EngineError(EngineErrorCode.SRI_MISMATCH, "SRI required for security verification.", engineId);
      }

      const cached = await this.storage.get(cacheKey);
      if (cached) {
        const isValid = await SecurityAdvisor.verifySRI(cached, config.sri);
        if (isValid) {
          const url = URL.createObjectURL(new Blob([cached], { type: "application/javascript" }));
          this.updateBlobUrl(cacheKey, url);
          return url;
        }
        await this.storage.delete(cacheKey);
      }

      const response = await fetch(config.url);
      if (!response.ok) throw new EngineError(EngineErrorCode.NETWORK_ERROR, `Failed to fetch engine: ${response.statusText}`, engineId);
      
      const data = await response.arrayBuffer();
      const isValid = await SecurityAdvisor.verifySRI(data, config.sri);
      if (!isValid) throw new EngineError(EngineErrorCode.SRI_MISMATCH, "SRI Mismatch", engineId);

      await this.storage.set(cacheKey, data);
      const url = URL.createObjectURL(new Blob([data], { type: "application/javascript" }));
      this.updateBlobUrl(cacheKey, url);
      return url;
    })();

    this.inflightLoads.set(cacheKey, promise);
    void promise.finally(() => this.inflightLoads.delete(cacheKey));
    return promise;
  }

  private updateBlobUrl(cacheKey: string, newUrl: string): void {
    const oldUrl = this.activeBlobs.get(cacheKey);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }
    this.activeBlobs.set(cacheKey, newUrl);
  }

  async loadResources(engineId: string, configs: Record<string, IEngineSourceConfig>): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const entries = Object.entries(configs);
    
    // 2026 Best Practice: Promise.allSettled を使用して部分的な失敗時のリークを防止
    const settledResults = await Promise.allSettled(
      entries.map(async ([key, config]) => {
        const url = await this.loadResource(engineId, config);
        return { key, url };
      })
    );

    const failures = settledResults.filter(r => r.status === "rejected") as PromiseRejectedResult[];
    if (failures.length > 0) {
      // ロールバック: 成功した分の URL を収集して呼び出し元に例外を投げる
      // 注意: 個別の loadResource 内で revoke 管理しているため、ここでは単純に rethrow
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
