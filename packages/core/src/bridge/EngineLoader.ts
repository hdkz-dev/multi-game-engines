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
  private inflightBatchLoads = new Map<
    string,
    Promise<Record<string, string>>
  >();
  private activeBlobs = new Map<string, string>(); // cacheKey -> blobUrl
  private activeBlobsByUrl = new Map<string, string>(); // blobUrl -> cacheKey
  private isProduction: boolean;
  private disposed = false;

  constructor(private storage: IFileStorage) {
    this.isProduction =
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] === "production";
  }

  private getMimeType(config: IEngineSourceConfig): string {
    switch (config.type) {
      case "wasm":
        return "application/wasm";
      case "eval-data":
      case "native":
      case "webgpu-compute":
      case "asset":
        return "application/octet-stream";
      case "worker-js":
      default:
        return "application/javascript";
    }
  }

  /**
   * 単一のエンジンリソースをフェッチ、検証、キャッシュ、および Blob URL 化します。
   *
   * @param engineId - リソースを所有するエンジンの ID。
   * @param config - リソース設定 (URL, SRI, タイプ等)。
   * @returns 生成された Blob URL。
   * @throws {EngineError} 検証失敗、ネットワークエラー、またはセキュリティ違反の場合。
   */
  async loadResource(
    engineId: string,
    config: IEngineSourceConfig,
  ): Promise<string> {
    if (this.disposed) {
      throw new EngineError({
        code: EngineErrorCode.LIFECYCLE_ERROR,
        message: "EngineLoader has been disposed.",
        engineId,
        i18nKey: "engine.errors.disposed",
      });
    }
    // 2026 Best Practice: 厳密な ID バリデーション (Silent sanitization 排除)
    if (/[^a-zA-Z0-9-_]/.test(engineId)) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Invalid engine ID: "${engineId}". Only alphanumeric characters, hyphens, and underscores are allowed.`,
        i18nKey: "engine.errors.invalidEngineId",
        i18nParams: { id: engineId },
      });
    }
    const safeId = engineId;
    const cacheKey = `${safeId}:${encodeURIComponent(config.url)}`;

    // 2026 Best Practice: アトミックロック (Promise を先に Map に入れてから非同期実行)
    // その前に、既に有効な Blob URL があればそれを返す（無駄な IO と Revocation を回避）
    const activeUrl = this.activeBlobs.get(cacheKey);
    if (activeUrl) return activeUrl;

    const existing = this.inflightLoads.get(cacheKey);
    if (existing) return existing;

    // 2026: SSR Compatibility Guard
    if (
      typeof URL === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      return config.url;
    }

    const promise = (async () => {
      try {
        // 2026 Best Practice: HTTPS 強制 (Strict Loopback Check)
        const base =
          typeof window !== "undefined"
            ? window.location.href
            : "https://multi-game-engines.local";
        const url = new URL(config.url, base);
        const isLoopback =
          url.hostname === "localhost" ||
          url.hostname === "127.0.0.1" ||
          url.hostname === "::1";

        if (url.protocol === "http:" && !isLoopback) {
          throw new EngineError({
            code: EngineErrorCode.SECURITY_ERROR,
            message:
              "Insecure connection (HTTP) is not allowed for sensitive engine files.",
            engineId,
            i18nKey: "engine.errors.insecureConnection",
            remediation: "Use HTTPS for all engine resource URLs.",
          });
        }

        // 2026 Best Practice: プロトコル・オリジン検証を通過した安全な URL を以降で使用
        const validatedUrl = url.href;

        // 2026 Security: Validate ALL resource URLs capable of execution (JS/Wasm)
        // Prevent bypassing checks by using obscure mime types or missing type field.
        // We default to strictly validate ALL types except specific safe data types.
        // This closes the hole where `config.type = "script"` could bypass validation but still execute.
        const isSafeType =
          config.type === "eval-data" ||
          config.type === "asset" ||
          config.type === "json" ||
          config.type === "text";

        if (!isSafeType) {
          this.validateWorkerUrl(validatedUrl, engineId);
        }

        const sri = config.sri;
        const unsafeNoSRI = config.__unsafeNoSRI === true;

        if (!sri && !unsafeNoSRI) {
          throw new EngineError({
            code: EngineErrorCode.SECURITY_ERROR,
            message: "SRI required for security verification.",
            engineId,
            i18nKey: "engine.errors.sriRequired",
          });
        }

        if (unsafeNoSRI && this.isProduction) {
          throw new EngineError({
            code: EngineErrorCode.SECURITY_ERROR,
            message:
              "SRI bypass (__unsafeNoSRI) is not allowed in production environment.",
            engineId,
            remediation: "Provide a valid SRI hash for all engine resources.",
          });
        }

        const cached = await this.storage.get(cacheKey);
        if (cached) {
          if (sri) {
            try {
              await SecurityAdvisor.assertSRI(cached, sri);
              const cachedBlobUrl = URL.createObjectURL(
                new Blob([cached], { type: this.getMimeType(config) }),
              );
              this.updateBlobUrl(cacheKey, cachedBlobUrl);
              return cachedBlobUrl;
            } catch (err) {
              // 2026 Best Practice: SRI 不一致（SRI_MISMATCH）のみキャッシュを破棄
              if (
                err instanceof EngineError &&
                err.code === EngineErrorCode.SRI_MISMATCH
              ) {
                await this.storage.delete(cacheKey);
              } else {
                // それ以外のエラー（DB不具合等）はそのまま上に流す
                throw err;
              }
            }
          } else if (config.__unsafeNoSRI) {
            // 2026: 非本番環境かつ SRI バイパス時はキャッシュをそのまま使用可能
            const bypassBlobUrl = URL.createObjectURL(
              new Blob([cached], { type: this.getMimeType(config) }),
            );
            this.updateBlobUrl(cacheKey, bypassBlobUrl);
            return bypassBlobUrl;
          }
        }

        // 2026 Best Practice: 検証済み URL を使用して fetch を実行
        let data: ArrayBuffer;
        try {
          const response = await fetch(validatedUrl);
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
            message: `Network error while fetching engine resource: ${validatedUrl}`,
            engineId,
            originalError: err,
          });
        }

        if (sri) {
          await SecurityAdvisor.assertSRI(data, sri);
        }

        await this.storage.set(cacheKey, data);
        const blob = new Blob([data], { type: this.getMimeType(config) });
        const blobUrl = URL.createObjectURL(blob);
        this.updateBlobUrl(cacheKey, blobUrl);
        return blobUrl;
      } finally {
        // 2026 Best Practice: 完了または失敗時に Map から除去し、再試行を可能にする
        this.inflightLoads.delete(cacheKey);
      }
    })();

    this.inflightLoads.set(cacheKey, promise);
    return promise;
  }

  private updateBlobUrl(cacheKey: string, newUrl: string): void {
    if (this.disposed) {
      URL.revokeObjectURL(newUrl);
      return;
    }
    const oldUrl = this.activeBlobs.get(cacheKey);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
      this.activeBlobsByUrl.delete(oldUrl);
    }
    this.activeBlobs.set(cacheKey, newUrl);
    this.activeBlobsByUrl.set(newUrl, cacheKey);
  }

  /**
   * 複数のリソースを一括でロードします。アトミック性を保証し、一部が失敗した場合は全てロールバックします。
   *
   * @param engineId - エンジン ID。
   * @param configs - キーとリソース設定のマップ。
   * @returns キーと Blob URL のマップ。
   */
  async loadResources(
    engineId: string,
    configs: Record<string, IEngineSourceConfig>,
  ): Promise<Record<string, string>> {
    // 2026 Best Practice: Config の指紋（ハッシュ）を含めてデデュプリケーション
    // JavaScript オブジェクトのキーの順序は保証されないため、ソートしてから文字列化して決定性を確保。
    const configHash = JSON.stringify(
      Object.keys(configs)
        .sort()
        .map((k) => [k, configs[k]]),
    );
    const batchKey = `${engineId}:${configHash}`;

    const existing = this.inflightBatchLoads.get(batchKey);
    if (existing) return existing;

    const promise = (async () => {
      try {
        return await this._loadResourcesImpl(engineId, configs);
      } finally {
        this.inflightBatchLoads.delete(batchKey);
      }
    })();

    this.inflightBatchLoads.set(batchKey, promise);
    return promise;
  }

  private async _loadResourcesImpl(
    engineId: string,
    configs: Record<string, IEngineSourceConfig>,
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const entries = Object.entries(configs);

    // 2026 Best Practice: ロールバック用に既存の有効な Blob URL セットを保持。
    // これにより、ロールバック時に「今回のロードで新しく生成されたもの」のみを特定して解放できます。
    const preExistingUrls = new Set(this.activeBlobs.values());

    // 2026 Best Practice: Promise.allSettled を使用して原子性と部分的なリーク防止を両立。
    const settledResults = await Promise.allSettled(
      entries.map(async ([key, config]) => {
        const url = await this.loadResource(engineId, config);
        return { key, url };
      }),
    );

    const failures = settledResults.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failures.length > 0) {
      // ロールバック: 今回のバッチで新しく生成された URL のみ revoke する（既存分は維持）
      for (const res of settledResults) {
        if (res.status === "fulfilled" && !preExistingUrls.has(res.value.url)) {
          this.revoke(res.value.url);
        }
      }
      const firstFailure = failures[0];
      if (firstFailure) {
        throw EngineError.from(firstFailure.reason);
      }
      throw new EngineError({
        code: EngineErrorCode.INTERNAL_ERROR,
        message: "Unknown error during resource loading",
        engineId,
        i18nKey: "engine.errors.resourceLoadUnknown",
        i18nParams: { engineId },
      });
    }

    for (const res of settledResults) {
      if (res.status === "fulfilled") {
        results[res.value.key] = res.value.url;
      }
    }

    return results;
  }

  /**
   * 指定された Blob URL を無効化し、内部管理マップから削除します。
   *
   * @param url - 無効化する Blob URL。
   */
  revoke(url: string): void {
    const cacheKey = this.activeBlobsByUrl.get(url);
    if (cacheKey) {
      URL.revokeObjectURL(url);
      this.activeBlobs.delete(cacheKey);
      this.activeBlobsByUrl.delete(url);
    }
  }

  /**
   * 2026 Best Practice: このローダーが生成したすべての Blob リソースを解放します。
   * EngineBridge の dispose 時に呼び出され、メモリリークを完全に防ぎます。
   */
  revokeAll(): void {
    this.disposed = true;
    for (const url of this.activeBlobs.values()) {
      URL.revokeObjectURL(url);
    }
    this.activeBlobs.clear();
    this.activeBlobsByUrl.clear();
    this.inflightLoads.clear();
    this.inflightBatchLoads.clear();
  }

  /**
   * 2026 Best Practice: 特定のエンジンIDに関連付けられたすべての Blob リソースを解放します。
   */
  revokeByEngineId(engineId: string): void {
    for (const [key, val] of this.activeBlobs.entries()) {
      if (key.startsWith(`${engineId}:`)) {
        URL.revokeObjectURL(val);
        this.activeBlobs.delete(key);
        this.activeBlobsByUrl.delete(val);
      }
    }
  }

  /**
   * 2026 Best Practice: Worker 実行コンテキストのオリジン検証
   */
  private validateWorkerUrl(url: string, engineId?: string): void {
    if (url.startsWith("blob:")) return;
    try {
      const base = typeof window !== "undefined" ? window.location.href : "";
      const parsedUrl = new URL(url, base || undefined);
      const isLoopback =
        parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1" ||
        parsedUrl.hostname === "::1";

      // 本番環境ではループバックも禁止（開発者モードの混入を防ぐ）
      if (this.isProduction && isLoopback) {
        throw new EngineError({
          code: EngineErrorCode.SECURITY_ERROR,
          message: `Loopback resources are prohibited in production: ${url}`,
          engineId,
        });
      }

      const currentOrigin =
        typeof window !== "undefined" ? window.location.origin : "";
      const isCrossOrigin = !!(
        currentOrigin && parsedUrl.origin !== currentOrigin
      );
      const shouldReject = isCrossOrigin && (this.isProduction || !isLoopback);

      if (shouldReject) {
        throw new EngineError({
          code: EngineErrorCode.SECURITY_ERROR,
          message: `Cross-origin Worker scripts are prohibited for security: ${url}`,
          engineId,
          remediation:
            "Host the engine worker script on the same origin or use a Blob URL via EngineLoader.",
        });
      }
    } catch (e) {
      if (e instanceof EngineError) throw e;
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `Invalid resource URL (Validation Failed): ${url}`,
        engineId,
      });
    }
  }
}
