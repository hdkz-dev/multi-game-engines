import { IEngineLoader, IEngineSourceConfig, IFileStorage } from "../types.js";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor.js";

/**
 * エンジンバイナリのダウンロード、SRI検証、ストレージ保存を管理するローダー。
 */
export class EngineLoader implements IEngineLoader {
  private inflightLoads = new Map<string, Promise<string>>();

  constructor(private storage: IFileStorage) {}

  async loadResource(engineId: string, config: IEngineSourceConfig): Promise<string> {
    const cacheKey = `${engineId}_${config.url}`;
    
    // アトミックロック: 同時に同じリソースをロードしない
    const existing = this.inflightLoads.get(cacheKey);
    if (existing) return existing;

    const promise = (async () => {
      try {
        if (!config.sri) {
          throw new Error("SRI required for security verification.");
        }

        const cached = await this.storage.get(cacheKey);
        if (cached) {
          const isValid = await SecurityAdvisor.verifySRI(cached, config.sri);
          if (isValid) {
            return URL.createObjectURL(new Blob([cached], { type: "application/javascript" }));
          }
          await this.storage.delete(cacheKey);
        }

        const response = await fetch(config.url);
        if (!response.ok) throw new Error(`Failed to fetch engine: ${response.statusText}`);
        
        const data = await response.arrayBuffer();
        const isValid = await SecurityAdvisor.verifySRI(data, config.sri);
        if (!isValid) throw new Error("SRI Mismatch");

        await this.storage.set(cacheKey, data);
        return URL.createObjectURL(new Blob([data], { type: "application/javascript" }));
      } finally {
        this.inflightLoads.delete(cacheKey);
      }
    })();

    this.inflightLoads.set(cacheKey, promise);
    return promise;
  }

  async loadResources(engineId: string, configs: Record<string, IEngineSourceConfig>): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    await Promise.all(
      Object.entries(configs).map(async ([key, config]) => {
        results[key] = await this.loadResource(engineId, config);
      })
    );
    return results;
  }

  revoke(url: string): void {
    URL.revokeObjectURL(url);
  }
}
