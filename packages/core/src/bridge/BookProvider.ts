import {
  IBookProvider,
  IBookAsset,
  IEngineLoader,
  ProgressCallback,
  IEngineSourceConfig,
} from "../types.js";

/**
 * 2026 Zenith Tier: 定跡書プロバイダーの標準実装。
 * エンジンローダーとストレージを活用して、定跡ファイルを管理します。
 */
export class BookProvider implements IBookProvider {
  constructor(private loader: IEngineLoader) {}

  async loadBook(
    asset: IBookAsset,
    options?: { signal?: AbortSignal; onProgress?: ProgressCallback },
  ): Promise<string> {
    // 2026: IEngineSourceConfig に変換してロード (exactOptionalPropertyTypes & Discriminated Union 対応)
    let config: IEngineSourceConfig;

    if (asset.sri) {
      config = {
        url: asset.url,
        type: "asset",
        sri: asset.sri,
      };
    } else {
      config = {
        url: asset.url,
        type: "asset",
        __unsafeNoSRI: true,
      };
    }

    if (asset.size) config.size = asset.size;

    return await this.loader.loadResource(
      "common-books", // 共有 ID
      config,
      options,
    );
  }

  async listCachedBooks(): Promise<string[]> {
    // 2026: ストレージからのリスト取得は IFileStorage の拡張が必要だが、
    // 現状は空配列を返す。
    return [];
  }

  async deleteBook(_id: string): Promise<void> {
    // 2026: revoke 等の処理
  }
}
