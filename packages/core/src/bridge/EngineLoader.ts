import { IFileStorage, IEngineSourceConfig, IEngineLoader, EngineErrorCode } from "../types";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor";
import { EngineError } from "../errors/EngineError";

/**
 * エンジンのバイナリやスクリプトを安全かつ効率的にロードするためのサービス。
 */
export class EngineLoader implements IEngineLoader {
  private activeBlobs = new Map<string, string>(); // blobKey -> blobUrl

  constructor(private readonly storage: IFileStorage) {}

  /**
   * 単一のリソースを取得します。
   */
  async loadResource(engineId: string, config: IEngineSourceConfig): Promise<string> {
    const results = await this.loadResources(engineId, { main: config });
    return results.main;
  }

  /**
   * 2026 Best Practice: 複数の依存リソースを一括でロード・検証します。
   * 全てのリソースが正常に取得できた場合のみ解決されます。
   */
  async loadResources(
    engineId: string,
    configs: Record<string, IEngineSourceConfig>
  ): Promise<Record<string, string>> {
    const entries = Object.entries(configs);
    const results: Record<string, string> = {};

    await Promise.all(
      entries.map(async ([key, config]) => {
        const blobKey = `${engineId}::${key}`;
        const cacheKey = `${engineId}::${config.sri}`;

        // 1. 既存の Blob URL があれば事前に破棄
        const existingBlob = this.activeBlobs.get(blobKey);
        if (existingBlob) {
          this.revoke(existingBlob);
        }

        // 2. SRI の形式チェック
        if (!config.sri) {
          throw new EngineError(EngineErrorCode.SRI_MISMATCH, `SRI required for ${config.url}`, engineId);
        }
        if (!SecurityAdvisor.isValidSRI(config.sri)) {
          throw new EngineError(EngineErrorCode.SRI_MISMATCH, `Invalid SRI: ${config.sri}`, engineId);
        }

        const mimeType = this.getMimeType(config.type);

        // 3. キャッシュまたはネットワークから取得
        let data: ArrayBuffer | null = null;
        try {
          data = await this.storage.get(cacheKey);
        } catch (err) {
          console.warn(`[EngineLoader] Cache read failed for ${blobKey}:`, err);
        }

        if (!data) {
          data = await this.fetchResource(config.url, config.sri, engineId);
          void this.storage.set(cacheKey, data).catch((err) => {
            console.warn(`[EngineLoader] Cache write failed for ${blobKey}:`, err);
          });
        }

        // 4. Blob URL の生成と管理
        const url = URL.createObjectURL(new Blob([data], { type: mimeType }));
        this.activeBlobs.set(blobKey, url);
        results[key] = url;
      })
    );

    return results;
  }

  private async fetchResource(url: string, sri: string, engineId: string): Promise<ArrayBuffer> {
    try {
      const options = SecurityAdvisor.getSafeFetchOptions(sri);
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new EngineError(
          EngineErrorCode.NETWORK_ERROR,
          `Failed to download engine resource: ${url} (HTTP ${response.status})`,
          engineId
        );
      }

      return await response.arrayBuffer();
    } catch (error) {
      if (error instanceof EngineError) throw error;
      throw new EngineError(
        EngineErrorCode.NETWORK_ERROR,
        `Network error while fetching resource: ${url}`,
        engineId,
        { cause: error }
      );
    }
  }

  private getMimeType(type?: string): string {
    switch (type) {
      case "wasm": return "application/wasm";
      case "worker-js":
      case "webgpu-compute": return "application/javascript";
      default: return "application/octet-stream";
    }
  }

  /**
   * 生成された Blob URL を解放します。
   */
  revoke(url: string): void {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      for (const [key, blobUrl] of this.activeBlobs.entries()) {
        if (blobUrl === url) {
          this.activeBlobs.delete(key);
          break;
        }
      }
    }
  }
}
