import {
  IEngineLoader,
  IEngineSourceConfig,
  EngineErrorCode,
  IFileStorage,
} from "../types.js";
import { EngineError } from "../errors/EngineError.js";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor.js";
import { createI18nKey } from "../protocol/ProtocolValidator.js";

/**
 * 2026 Zenith Tier: エンジンリソース（WASM, JS, Assets）の物理的ロードと SRI 検証を管理。
 */
export class EngineLoader implements IEngineLoader {
  private activeBlobs = new Map<string, string>();
  private inflight = new Map<string, Promise<string>>();

  constructor(private readonly storage?: IFileStorage) {}

  /**
   * 単一のリソースをロードします。
   */
  async loadResource(
    engineId: string,
    config: IEngineSourceConfig,
  ): Promise<string> {
    this.validateResourceUrl(config, engineId);

    const safeId = engineId.replace(/[^a-zA-Z0-9]/g, "_");
    const cacheKey = `${safeId}-${encodeURIComponent(config.url)}`;

    if (this.activeBlobs.has(cacheKey)) {
      return this.activeBlobs.get(cacheKey)!;
    }

    if (this.inflight.has(cacheKey)) {
      return this.inflight.get(cacheKey)!;
    }

    const performLoad = async (): Promise<string> => {
      try {
        if (this.storage) {
          const cached = await this.storage.get(cacheKey);
          if (cached) {
            const url = URL.createObjectURL(
              new Blob([cached], {
                type: this.getMimeType(config.type || "worker-js"),
              }),
            );
            this.activeBlobs.set(cacheKey, url);
            return url;
          }
        }

        const fetchOptions = SecurityAdvisor.getSafeFetchOptions(config.sri);

        // Protocol safety (HTTPS enforcement) is handled inside SecurityAdvisor.safeFetch().
        const response = await SecurityAdvisor.safeFetch(config.url, {
          ...fetchOptions,
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          this.inflight.delete(cacheKey);
          throw new EngineError({
            code: EngineErrorCode.NETWORK_ERROR,
            message: `Failed to download engine resource: ${config.url} (${response.status})`,
            engineId,
          });
        }

        const buffer = await response.arrayBuffer();
        if (this.storage) {
          void this.storage.set(cacheKey, buffer);
        }

        const url = URL.createObjectURL(
          new Blob([buffer], {
            type: this.getMimeType(config.type || "worker-js"),
          }),
        );
        this.activeBlobs.set(cacheKey, url);
        return url;
      } catch (err) {
        this.inflight.delete(cacheKey);
        if (err instanceof EngineError) throw err;
        throw new EngineError({
          code: EngineErrorCode.NETWORK_ERROR,
          message: `Failed to fetch engine resource: ${config.url}`,
          engineId,
          // originalError は IEngineError に定義されていないため message に含めるかキャスト
        });
      } finally {
        this.inflight.delete(cacheKey);
      }
    };

    const loadPromise = performLoad();
    this.inflight.set(cacheKey, loadPromise);

    return loadPromise.finally(() => {
      this.inflight.delete(cacheKey);
    });
  }

  /**
   * 複数のリソースをロードします。
   */
  async loadResources(
    engineId: string,
    sources: Record<string, IEngineSourceConfig>,
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const localNewUrls = new Set<string>();

    try {
      for (const [key, config] of Object.entries(sources)) {
        const url = await this.loadResource(engineId, config);
        results[key] = url;
        localNewUrls.add(url);
      }
      return results;
    } catch (err) {
      for (const url of localNewUrls) {
        this.revoke(url);
      }
      throw err;
    }
  }

  private validateResourceUrl(
    config: IEngineSourceConfig,
    engineId: string,
    forceProduction?: boolean,
  ): void {
    const url = config.url;

    if (!/^[a-zA-Z0-9_-]+$/.test(engineId)) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `Invalid engine ID: ${engineId}`,
        engineId,
        i18nKey: createI18nKey("engine.errors.invalidEngineId"),
      });
    }

    if (url.toLowerCase().startsWith("http:")) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        throw new EngineError({
          code: EngineErrorCode.SECURITY_ERROR,
          message: `Invalid URL format: ${url}`,
          engineId,
          i18nKey: createI18nKey("engine.errors.insecureConnection"),
        });
      }
      if (!SecurityAdvisor.isLoopbackHost(parsedUrl.hostname)) {
        throw new EngineError({
          code: EngineErrorCode.SECURITY_ERROR,
          message: `Insecure connection (HTTP) is not allowed: ${url}`,
          engineId,
          i18nKey: createI18nKey("engine.errors.insecureConnection"),
        });
      }
    }

    if (config.__unsafeNoSRI) {
      const isProd =
        forceProduction ??
        ((typeof process !== "undefined" &&
          process.env["NODE_ENV"] === "production") ||
          (globalThis as Record<string, unknown>).NODE_ENV === "production");
      if (isProd) {
        throw new EngineError({
          code: EngineErrorCode.SECURITY_ERROR,
          message: "SRI bypass (__unsafeNoSRI) is not allowed in production.",
          engineId,
          i18nKey: createI18nKey("engine.errors.sriBypassNotAllowed"),
        });
      }
    } else if (!config.sri) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `SRI hash is required for resource: ${url}`,
        engineId,
        i18nKey: createI18nKey("engine.errors.securityError"),
      });
    }
  }

  /**
   * 特定のエンジンのリソースを物理的に解放します。
   */
  revokeByEngineId(engineId: string): void {
    const safeId = engineId.replace(/[^a-zA-Z0-9]/g, "_");
    const prefix = `${safeId}-`;
    for (const [key, url] of this.activeBlobs.entries()) {
      if (key.startsWith(prefix)) {
        this.revoke(url);
        this.activeBlobs.delete(key);
      }
    }
  }

  /**
   * 全てのリソースを物理的に解放します。
   */
  revokeAll(): void {
    for (const url of this.activeBlobs.values()) {
      this.revoke(url);
    }
    this.activeBlobs.clear();
    this.inflight.clear();
  }

  /**
   * 指定された URL を物理的に解放します。
   */
  public revoke(url: string): void {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }

  private getMimeType(type: string): string {
    switch (type) {
      case "worker-js":
        return "application/javascript";
      case "wasm":
        return "application/wasm";
      case "json":
        return "application/json";
      case "text":
        return "text/plain";
      default:
        return "application/octet-stream";
    }
  }
}
