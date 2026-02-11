import { IFileStorage, IEngineSourceConfig, IEngineLoader, EngineErrorCode } from "../types";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor";
import { EngineError } from "../errors/EngineError";

/**
 * エンジンのバイナリやスクリプトを安全かつ効率的にロードするためのサービス。
 */
export class EngineLoader implements IEngineLoader {
  constructor(private readonly storage: IFileStorage) {}

  /**
   * 指定された設定に基づいてリソースを取得します。
   */
  async loadResource(engineId: string, config: IEngineSourceConfig): Promise<string> {
    // 1. SRI の形式チェック (Fail-fast)
    if (config.sri && !SecurityAdvisor.isValidSRI(config.sri)) {
      throw new EngineError(
        EngineErrorCode.SRI_MISMATCH,
        `Invalid SRI hash format: ${config.sri}`,
        engineId
      );
    }

    /**
     * キャッシュキーの生成。
     * SRI が存在しない場合は URL をキーの一部として使用し、衝突を回避。
     */
    const cacheKey = config.sri
      ? `${engineId}::${config.sri}`
      : `${engineId}::${btoa(config.url).replace(/=/g, "")}`;
    
    // MIME type の決定 (2026 Best Practice: Content-Type Preservation)
    let mimeType: string;
    switch (config.type) {
      case "wasm":
        mimeType = "application/wasm";
        break;
      case "worker-js":
      case "webgpu-compute":
        mimeType = "application/javascript";
        break;
      default:
        mimeType = "application/octet-stream";
    }

    // 2. 永続ストレージ（キャッシュ）から取得を試みる
    const cached = await this.storage.get(cacheKey);
    if (cached) {
      return URL.createObjectURL(new Blob([cached], { type: mimeType }));
    }

    // 3. キャッシュがない場合はネットワークから取得 (SRI 検証付き)
    try {
      const options = SecurityAdvisor.getSafeFetchOptions(config.sri);
      const response = await fetch(config.url, {
        ...options,
        signal: AbortSignal.timeout(30_000), // 30秒タイムアウトを強制
      });
      
      if (!response.ok) {
        throw new EngineError(
          EngineErrorCode.NETWORK_ERROR,
          `Failed to download engine resource: ${config.url} (Status: ${response.status})`,
          engineId
        );
      }

      const data = await response.arrayBuffer();

      // 4. 次回のためにストレージに保存
      void this.storage.set(cacheKey, data).catch(err => {
        console.warn(`[EngineLoader] Failed to cache resource: ${engineId}`, err);
      });

      return URL.createObjectURL(new Blob([data], { type: mimeType }));

    } catch (error) {
      if (error instanceof EngineError) throw error;
      throw new EngineError(
        EngineErrorCode.NETWORK_ERROR,
        `Network error during engine resource load: ${config.url}`,
        engineId,
        error
      );
    }
  }

  /**
   * 生成された Blob URL を解放します。
   */
  revoke(url: string): void {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}
