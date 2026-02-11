import { IFileStorage, IEngineSourceConfig, IEngineLoader, EngineErrorCode } from "../types";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor";
import { EngineError } from "../errors/EngineError";

/**
 * エンジンのリソース取得・検証・キャッシュを統括するサービス。
 */
export class EngineLoader implements IEngineLoader {
  constructor(private readonly storage: IFileStorage) {}

  /**
   * 指定された設定に基づいてリソースを取得します。
   * @returns Blob URL (WebWorker等で使用可能)
   */
  async loadResource(engineId: string, config: IEngineSourceConfig): Promise<string> {
    // 1. SRI ハッシュの形式バリデーション
    if (config.sri && !SecurityAdvisor.isValidSRI(config.sri)) {
      throw new EngineError(
        EngineErrorCode.SRI_MISMATCH,
        `Invalid SRI hash format: ${config.sri}`,
        engineId
      );
    }

    /** 
     * キャッシュキーの生成。
     * 衝突防止のため SRI がない場合は URL を基にしたキーを使用。
     */
    const cacheKey = config.sri
      ? `${engineId}::${config.sri}`
      : `${engineId}::${btoa(config.url).replace(/=/g, "")}`;
    
    // リソースのタイプに応じた MIME type の選択 (2026 Best Practice)
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

    // 2. キャッシュヒット確認
    const cached = await this.storage.get(cacheKey);
    if (cached) {
      return URL.createObjectURL(new Blob([cached], { type: mimeType }));
    }

    // 3. ネットワーク取得 (タイムアウト・エラーハンドリング付き)
    try {
      const options = SecurityAdvisor.getSafeFetchOptions(config.sri);
      const response = await fetch(config.url, {
        ...options,
        signal: AbortSignal.timeout(30_000), // 通信の無期限ハングを防止
      });
      
      if (!response.ok) {
        throw new EngineError(
          EngineErrorCode.NETWORK_ERROR,
          `Failed to download resource: ${config.url} (HTTP ${response.status})`,
          engineId
        );
      }

      const data = await response.arrayBuffer();

      // 4. ストレージへの非同期キャッシュ保存
      void this.storage.set(cacheKey, data).catch(err => {
        console.warn(`[EngineLoader] Failed to cache resource for ${engineId}:`, err);
      });

      return URL.createObjectURL(new Blob([data], { type: mimeType }));

    } catch (error) {
      if (error instanceof EngineError) throw error;
      throw new EngineError(
        EngineErrorCode.NETWORK_ERROR,
        `Exception occurred while loading engine resource: ${config.url}`,
        engineId,
        error
      );
    }
  }

  /**
   * 生成された一時的な Blob URL を解放します。
   */
  revoke(url: string): void {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}
