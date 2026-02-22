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
  private activeBlobs = new Map<string, string>(); // cacheKey -> blobUrl
  private isProduction: boolean;

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
    // 2026 Best Practice: 厳密な ID バリデーション (Silent sanitization 排除)
    if (/[^a-zA-Z0-9-_]/.test(engineId)) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Invalid engine ID: "${engineId}". Only alphanumeric characters, hyphens, and underscores are allowed.`,
      });
    }
    const safeId = engineId;
    const cacheKey = `${safeId}-${encodeURIComponent(config.url)}`;

    // 2026 Best Practice: アトミックロック (Promise を先に Map に入れてから非同期実行)
    // その前に、既に有効な Blob URL があればそれを返す（無駄な IO と Revocation を回避）
    const activeUrl = this.activeBlobs.get(cacheKey);
    if (activeUrl) return activeUrl;

    const existing = this.inflightLoads.get(cacheKey);
    if (existing) return existing;

    // 2026: SSR Compatibility Guard
    if (typeof URL.createObjectURL === "undefined") {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message:
          "EngineLoader requires a browser environment with Blob URL support.",
        engineId,
      });
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
            const isValid = await SecurityAdvisor.verifySRI(cached, sri);
            if (isValid) {
              const cachedBlobUrl = URL.createObjectURL(
                new Blob([cached], { type: this.getMimeType(config) }),
              );
              this.updateBlobUrl(cacheKey, cachedBlobUrl);
              return cachedBlobUrl;
            }
            await this.storage.delete(cacheKey);
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
          const isValid = await SecurityAdvisor.verifySRI(data, sri);
          if (!isValid) {
            throw new EngineError({
              code: EngineErrorCode.SRI_MISMATCH,
              message: "SRI Mismatch",
              engineId,
            });
          }
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
    const oldUrl = this.activeBlobs.get(cacheKey);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }
    this.activeBlobs.set(cacheKey, newUrl);
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
    const results: Record<string, string> = {};
    const entries = Object.entries(configs);

    // 2026 Best Practice: Promise.allSettled を使用して部分的な失敗時のリークを防止
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
      // ロールバック: 成功した分の URL を revoke する
      for (const res of settledResults) {
        if (res.status === "fulfilled") {
          this.revoke(res.value.url);
        }
      }
      const firstFailure = failures[0];
      if (firstFailure) {
        throw EngineError.from(firstFailure.reason);
      }
      throw new Error("Unknown error during resource loading");
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
    URL.revokeObjectURL(url);
    // マップからも削除
    for (const [key, val] of this.activeBlobs.entries()) {
      if (val === url) {
        this.activeBlobs.delete(key);
        break;
      }
    }
  }

  /**
   * 2026 Best Practice: 特定のエンジンIDに関連付けられたすべての Blob リソースを解放します。
   */
  revokeByEngineId(engineId: string): void {
    for (const [key, val] of this.activeBlobs.entries()) {
      if (key.startsWith(`${engineId}-`)) {
        URL.revokeObjectURL(val);
        this.activeBlobs.delete(key);
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
      const isCrossOrigin = currentOrigin && parsedUrl.origin !== currentOrigin;
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
