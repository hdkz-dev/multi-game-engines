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
    if (!config.sri) {
      throw new EngineError(
        EngineErrorCode.SRI_MISMATCH,
        `SRI hash is required for engine resource: ${config.url}. Content verification is mandatory for security.`,
        engineId
      );
    }

    if (!SecurityAdvisor.isValidSRI(config.sri)) {
      throw new EngineError(
        EngineErrorCode.SRI_MISMATCH,
        `Invalid SRI hash format: ${config.sri}. Resource loading blocked for safety.`,
        engineId
      );
    }

    /** 
     * キャッシュキーの生成。
     */
    const cacheKey = `${engineId}::${config.sri}`;
    
    // MIME type の決定
    let mimeType: string;
    if (config.type === "wasm") mimeType = "application/wasm";
    else if (config.type === "worker-js" || config.type === "webgpu-compute") mimeType = "application/javascript";
    else mimeType = "application/octet-stream";

    // 2. 永続ストレージ（キャッシュ）から取得を試みる
    try {
      const cached = await this.storage.get(cacheKey);
      if (cached) {
        return URL.createObjectURL(new Blob([cached], { type: mimeType }));
      }
    } catch (err) {
      console.warn(`[EngineLoader] Optional cache read failed for ${engineId}:`, err);
    }

    // 3. キャッシュがない場合はネットワークから取得 (SRI 検証付き)
    try {
      const options = SecurityAdvisor.getSafeFetchOptions(config.sri);
      const response = await fetch(config.url, {
        ...options,
        signal: AbortSignal.timeout(30_000), // 通信のハング防止
      });
      
      if (!response.ok) {
        throw new EngineError(
          EngineErrorCode.NETWORK_ERROR,
          `Failed to download engine resource from ${config.url}. (HTTP Status: ${response.status} ${response.statusText})`,
          engineId
        );
      }

      const data = await response.arrayBuffer();

      // 4. ストレージへの保存 (非同期)
      void this.storage.set(cacheKey, data).catch(err => {
        console.warn(`[EngineLoader] Background cache write failed for ${engineId}:`, err);
      });

      return URL.createObjectURL(new Blob([data], { type: mimeType }));

    } catch (error) {
      if (error instanceof EngineError) throw error;
      throw new EngineError(
        EngineErrorCode.NETWORK_ERROR,
        `An exception occurred while fetching resource: ${config.url}`,
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
