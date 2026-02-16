import { ResourceMap } from "../types.js";

/**
 * Worker 側でリソースの注入とパス解決を管理するユーティリティ。
 */
export class ResourceInjector {
  private static resources: ResourceMap = {};
  private static isReady = false;
  private static readyCallbacks: (() => void)[] = [];

  /**
   * メッセージを監視し、リソース注入コマンドを処理します。
   * @param onMessage 既存の onmessage ハンドラがある場合に渡すと、リソース注入以外のメッセージを委譲します。
   */
  static listen(onMessage?: (ev: MessageEvent) => void): void {
    const handler = (ev: MessageEvent) => {
      if (ev.data && ev.data.type === "MG_INJECT_RESOURCES") {
        this.resources = { ...this.resources, ...ev.data.resources };
        this.isReady = true;

        // 注入完了をホストに通知（ハンドシェイク）
        if (typeof self !== "undefined") {
          (
            self as unknown as { postMessage: (msg: unknown) => void }
          ).postMessage({
            type: "MG_RESOURCES_READY",
          });
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

    if (typeof addEventListener !== "undefined") {
      addEventListener("message", handler);
    } else if (typeof self !== "undefined") {
      (self as unknown as { onmessage: unknown }).onmessage = handler;
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
   * マップにない場合は元のパスを返します。
   */
  static resolve(path: string): string {
    // パスの正規化: セキュリティのため、絶対パス化や相対参照の排除を行う簡易的な処理
    const normalizedPath = path.startsWith("./") ? path.slice(2) : path;

    if (this.resources[normalizedPath]) return this.resources[normalizedPath];

    // 末尾一致（相対パス解決の模倣）
    for (const [mountPath, blobUrl] of Object.entries(this.resources)) {
      if (normalizedPath.endsWith(mountPath)) {
        return blobUrl;
      }
    }

    return path;
  }

  /**
   * global fetch をオーバーライドして、注入されたリソースを自動的に解決するようにします。
   * Emscripten 等の WASM ローダーが外部ファイルを fetch しようとする際に有効です。
   */
  static interceptFetch(): void {
    const originalFetch = fetch;
    (globalThis as unknown as { fetch: unknown }).fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
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
}
