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
   * @returns 生成された Blob URL。WebWorker のコンストラクタに直接渡すことができます。
   * @throws {EngineError} SRI不一致やネットワーク障害時に発生
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

    const cacheKey = `${engineId}_${config.sri}`;
    
    // 2. 永続ストレージ（キャッシュ）から取得を試みる
    const cached = await this.storage.get(cacheKey);
    if (cached) {
      // キャッシュがあれば Blob URL を生成して即座に返す
      return URL.createObjectURL(new Blob([cached], { type: "application/javascript" }));
    }

    // 3. キャッシュがない場合はネットワークから取得 (SRI 検証付き)
    const options = SecurityAdvisor.getSafeFetchOptions(config.sri);
    const response = await fetch(config.url, options);
    
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
    return URL.createObjectURL(new Blob([data], { type: "application/javascript" }));
  }

  /**
   * 生成された Blob URL を解放し、メモリリークを防止します。
   * インスタンス破棄時やアダプターの終了時に呼び出す必要があります。
   */
  revoke(url: string): void {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}
