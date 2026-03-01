import { createI18nKey } from "../protocol/ProtocolValidator.js";
import { ResourceMap, EngineErrorCode } from "../types.js";
import { EngineError } from "../errors/EngineError.js";

interface MessagePayload {
  type: string;
  resources?: ResourceMap;
  [key: string]: unknown;
}

interface WorkerGlobalScope {
  postMessage: (message: unknown) => void;
  onmessage: ((ev: MessageEvent) => void) | null;
}

interface EmscriptenFS {
  mkdir: (path: string) => void;
  writeFile: (path: string, data: Uint8Array) => void;
}

interface EmscriptenModule {
  FS?: EmscriptenFS;
  locateFile?: (path: string, prefix: string) => string;
  [key: string]: unknown;
}

/**
 * Worker 側でリソースの注入とパス解決を管理するユーティリティ。
 */
export class ResourceInjector {
  private static resources: ResourceMap = {};
  private static isReady = false;
  private static readyCallbacks: (() => void)[] = [];

  /**
   * WorkerGlobalScope の型ガード
   */
  private static isWorkerScope(obj: unknown): obj is WorkerGlobalScope {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "postMessage" in obj &&
      typeof (obj as { postMessage?: unknown }).postMessage === "function" &&
      "onmessage" in obj &&
      !("document" in obj)
    );
  }

  /**
   * メッセージを監視し、リソース注入コマンドを処理します。
   */
  static listen(onMessage?: (ev: MessageEvent) => void): void {
    const handler = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || typeof data !== "object") return;

      const payload = data as MessagePayload;

      if (payload.type === "MG_INJECT_RESOURCES") {
        if (!payload.resources || typeof payload.resources !== "object") {
          throw new EngineError({
            code: EngineErrorCode.PROTOCOL_ERROR,
            message:
              "[ResourceInjector] Invalid or missing resources in MG_INJECT_RESOURCES",
            i18nKey: createI18nKey("engine.errors.protocolError"),
            i18nParams: { message: "Invalid resources payload" },
          });
        }

        this.resources = { ...this.resources, ...payload.resources };
        this.isReady = true;

        if (typeof self !== "undefined" && this.isWorkerScope(self)) {
          self.postMessage({ type: "MG_RESOURCES_READY" });
        }

        const callbacks = [...this.readyCallbacks];
        this.readyCallbacks = [];
        callbacks.forEach((cb) => cb());
        return;
      }

      if (onMessage) {
        onMessage(ev);
      }
    };

    if (typeof globalThis.addEventListener === "function") {
      globalThis.addEventListener("message", handler);
    } else if (typeof self !== "undefined" && this.isWorkerScope(self)) {
      self.onmessage = handler;
    }
  }

  /**
   * リソースの注入が完了するまで待機します。
   */
  static waitForReady(): Promise<void> {
    if (this.isReady) return Promise.resolve();
    return new Promise((resolve) => {
      this.readyCallbacks.push(resolve);
    });
  }

  /**
   * 指定されたパスに対応する Blob URL を返します。
   */
  static resolve(path: string): string {
    let decodedPath = path;
    let prevPath = "";

    try {
      while (decodedPath !== prevPath) {
        prevPath = decodedPath;
        decodedPath = decodeURIComponent(decodedPath);
      }
    } catch {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `[ResourceInjector] Invalid URL encoding in path: "${path}"`,
        i18nKey: createI18nKey("engine.errors.illegalCharacters"),
      });
    }

    const normalizedForCheck = decodedPath.replace(/\\/g, "/");

    if (
      normalizedForCheck.includes("..") ||
      normalizedForCheck.startsWith("/") ||
      normalizedForCheck.includes("./")
    ) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `[ResourceInjector] Path pattern detected: "${path}"`,
        i18nKey: createI18nKey("engine.errors.securityViolation"),
      });
    }

    const lookupPath = path.startsWith("./") ? path.slice(2) : path;
    if (this.resources[lookupPath]) return this.resources[lookupPath];

    for (const [mountPath, blobUrl] of Object.entries(this.resources)) {
      // 2026: Precise suffix match (ensure it matches a whole segment or the whole path)
      if (
        lookupPath === mountPath ||
        (lookupPath.endsWith(mountPath) &&
          lookupPath.charAt(lookupPath.length - mountPath.length - 1) === "/")
      ) {
        return blobUrl;
      }
    }

    return path;
  }

  /**
   * global fetch をオーバーライドして、注入されたリソースを自動的に解決します。
   */
  static interceptFetch(): void {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      const resolvedUrl = this.resolve(url);
      if (resolvedUrl !== url) {
        return originalFetch(resolvedUrl, init);
      }
      return originalFetch(input, init);
    };
  }

  /**
   * Emscripten の Module オブジェクトに対してリソース解決ロジックを注入します。
   */
  static adaptEmscriptenModule(moduleParams: EmscriptenModule): void {
    if (!moduleParams) return;
    const originalLocateFile = moduleParams.locateFile;
    moduleParams.locateFile = (path: string, prefix: string) => {
      const resolved = this.resolve(path);
      if (resolved !== path && resolved.startsWith("blob:")) {
        return resolved;
      }
      return originalLocateFile
        ? originalLocateFile(path, prefix)
        : prefix + path;
    };
  }

  /**
   * Emscripten の仮想ファイルシステム (FS) にリソースをマウントします。
   */
  static async mountToVFS(
    moduleInstance: EmscriptenModule,
    vfsPath: string,
    resourceKey: string,
  ): Promise<void> {
    if (!moduleInstance || !moduleInstance.FS) {
      throw new EngineError({
        code: EngineErrorCode.INTERNAL_ERROR,
        message: "ResourceInjector: Module instance or FS not found.",
        i18nKey: createI18nKey("engine.errors.internalError"),
        i18nParams: { message: "Module or FS not found" },
      });
    }

    const blobUrl = this.resolve(resourceKey);
    if (blobUrl === resourceKey) {
      console.warn(
        `[ResourceInjector] Resource key "${resourceKey}" not resolved.`,
      );
    }

    try {
      const response = await globalThis.fetch(blobUrl);
      if (!response.ok) {
        throw new EngineError({
          code: EngineErrorCode.NETWORK_ERROR,
          message: `Failed to fetch resource: ${response.statusText}`,
          i18nKey: createI18nKey("engine.errors.networkError"),
        });
      }

      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);

      const parts = vfsPath.split("/").filter((p) => p);
      if (parts.length > 1) {
        let currentPath = "";
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath += "/" + parts[i];
          try {
            moduleInstance.FS.mkdir(currentPath);
          } catch (e: unknown) {
            if (!this.isFsError(e) || e.code !== "EEXIST") throw e;
          }
        }
      }

      moduleInstance.FS.writeFile(vfsPath, data);
    } catch (error: unknown) {
      if (error instanceof EngineError) throw error;
      throw new EngineError({
        code: EngineErrorCode.INTERNAL_ERROR,
        message: `Failed to mount "${resourceKey}" to "${vfsPath}": ${error}`,
        i18nKey: createI18nKey("engine.errors.internalError"),
        i18nParams: { message: `Mount failed: ${resourceKey}` },
      });
    }
  }

  private static isFsError(e: unknown): e is { code: string } {
    return (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code: unknown }).code === "string"
    );
  }
}
