import { IFileStorage, IEngineSourceConfig, IEngineLoader, EngineErrorCode } from "../types";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor";
import { EngineError } from "../errors/EngineError";

/**
 * エンジンのバイナリやスクリプトを安全かつ効率的にロードするためのサービス。
 * 
 * 特徴:
 * - SRI (Subresource Integrity) による改竄防止
 * - FileStorage (OPFS/IndexedDB) による永続化キャッシュ
 * - Blob URL による WebWorker のシームレスな起動
 */
export class EngineLoader implements IEngineLoader {
  constructor(private readonly storage: IFileStorage) {}

  /**
   * 指定された設定に基づいてリソースを取得します。
   * キャッシュが存在する場合はそれを利用し、存在しない場合はダウンロードして保存します。
   * 
   * @returns 生成された Blob URL (string)。WebWorker のコンストラクタに直接渡すことができます。
   * 将来的には ArrayBuffer を直接返すオプションを追加する可能性があります。
   * @throws {EngineError} SRI不一致やネットワーク障害時に発生
   */
  async loadResource(engineId: string, config: IEngineSourceConfig): Promise<string> {
    // 1. SRI の形式チェック (Fail-fast)
    // 空文字列の場合はチェックをスキップするが、キャッシュキーにはURLを含めるなどの対策が必要
    if (config.sri && !SecurityAdvisor.isValidSRI(config.sri)) {
      throw new EngineError(
        EngineErrorCode.SRI_MISMATCH,
        `Invalid SRI hash format: ${config.sri}`,
        engineId
      );
    }

    // キャッシュキーの生成: SRIがない場合はURLをキーに含めることで衝突を回避
    const cacheKey = config.sri
      ? `${engineId}_${config.sri}`
      : `${engineId}_${btoa(config.url).replace(/=/g, "")}`;
    
    // MIME type の決定
    let mimeType: string;
    if (config.type === "wasm") mimeType = "application/wasm";
    else if (config.type === "worker-js") mimeType = "application/javascript";
    else if (config.type === "webgpu-compute") mimeType = "application/javascript";
    else mimeType = "application/octet-stream";

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
        signal: AbortSignal.timeout(30_000), // 30秒タイムアウト
      });
      
      if (!response.ok) {
        throw new EngineError(
          EngineErrorCode.NETWORK_ERROR,
          `Failed to download engine resource: ${config.url} (${response.status})`,
          engineId
        );
      }

      const data = await response.arrayBuffer();

      // 4. 次回のためにストレージに保存（非同期で実行）
      void this.storage.set(cacheKey, data).catch(err => {
        console.warn(`Failed to cache engine resource: ${engineId}`, err);
      });

      // 5. Blob URL を生成して返す
      return URL.createObjectURL(new Blob([data], { type: mimeType }));

    } catch (error) {
      if (error instanceof EngineError) throw error;
      throw new EngineError(
        EngineErrorCode.NETWORK_ERROR,
        `Network error during resource load: ${config.url}`,
        engineId,
        error
      );
    }
  }

  /**
   * 生成された Blob URL を解放し、メモリリークを防止します。
   */
  revoke(url: string): void {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}
