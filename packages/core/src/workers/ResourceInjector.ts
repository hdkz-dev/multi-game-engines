import { ResourceMap } from "../types.js";

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
   * メッセージを監視し、リソース注入コマンドを処理します。
   * @param onMessage 既存の onmessage ハンドラがある場合に渡すと、リソース注入以外のメッセージを委譲します。
   */
  static listen(onMessage?: (ev: MessageEvent) => void): void {
    const handler = (ev: MessageEvent) => {
      const data = ev.data;

      // 1. 最小限の構造チェック（パッシブ・フィルタリング）
      if (!data || typeof data !== "object") return;

      const payload = data as MessagePayload;

      // 2. アクティブなコマンド処理
      if (payload.type === "MG_INJECT_RESOURCES") {
        // ADR-026: Refuse by Exception (厳格なランタイム検証)
        if (!payload.resources || typeof payload.resources !== "object") {
          throw new Error(
            "[ResourceInjector] Protocol Error: Invalid or missing resources in MG_INJECT_RESOURCES",
          );
        }

        this.resources = { ...this.resources, ...payload.resources };
        this.isReady = true;

        // 注入完了をホストに通知（ハンドシェイク）
        if (typeof self !== "undefined") {
          const workerScope = self as unknown as WorkerGlobalScope;
          if (typeof workerScope.postMessage === "function") {
            workerScope.postMessage({
              type: "MG_RESOURCES_READY",
            });
          }
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
    } else if (typeof self !== "undefined") {
      const workerScope = self as unknown as WorkerGlobalScope;
      // 2026 Best Practice: ランタイムガードによる安全な代入
      if ("onmessage" in workerScope) {
        workerScope.onmessage = handler;
      }
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
    // 2026 Best Practice: ADR-026 Refuse by Exception
    // URL エンコードされた攻撃パターンやバックスラッシュを検出するため
    // デコードと正規化を行ってから検証します
    let decodedPath = path;
    let prevPath = "";

    // 二重エンコーディング対策: 安定するまでデコード
    try {
      while (decodedPath !== prevPath) {
        prevPath = decodedPath;
        decodedPath = decodeURIComponent(decodedPath);
      }
    } catch {
      throw new Error(
        `[ResourceInjector] SECURITY_ERROR: Invalid URL encoding in path: "${path}"`,
      );
    }

    // バックスラッシュの正規化
    const normalizedForCheck = decodedPath.replace(/\\/g, "/");

    if (
      normalizedForCheck.includes("..") ||
      normalizedForCheck.startsWith("/") ||
      normalizedForCheck.includes("./")
    ) {
      throw new Error(
        `[ResourceInjector] SECURITY_ERROR: Invalid or restricted path pattern detected: "${path}"`,
      );
    }

    // ルックアップ用の正規化
    const lookupPath = path.startsWith("./") ? path.slice(2) : path;

    if (this.resources[lookupPath]) return this.resources[lookupPath];

    // 末尾一致（相対パス解決の模倣）
    for (const [mountPath, blobUrl] of Object.entries(this.resources)) {
      if (lookupPath.endsWith(mountPath)) {
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
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      const resolvedUrl = this.resolve(url);

      // 解決された URL が異なる場合（Blob URL等）、かつ相対パス解決が必要な場合への対応
      if (resolvedUrl !== url) {
        return originalFetch(resolvedUrl, init);
      }

      return originalFetch(input, init);
    };
  }

  /**
   * Emscripten の Module オブジェクトに対して、リソース解決ロジックを注入します。
   * 特に `locateFile` フックをオーバーライドし、WASM バイナリや mem ファイルのパスを
   * ResourceInjector が管理する Blob URL に差し替えます。
   *
   * @param moduleParams Emscripten の Module オブジェクト（初期化前パラメータ）
   */
  static adaptEmscriptenModule(moduleParams: EmscriptenModule): void {
    if (!moduleParams) return;

    const originalLocateFile = moduleParams.locateFile;

    moduleParams.locateFile = (path: string, prefix: string) => {
      // まず ResourceInjector で解決を試みる
      const resolved = this.resolve(path);

      // Blob URL に解決された場合、prefix を無視してその URL を返す
      // (WASM ローダーは Blob URL を直接フェッチできるため)
      if (resolved !== path && resolved.startsWith("blob:")) {
        return resolved;
      }

      // 解決できなかった、または Blob URL でない場合は元のロジックに従う
      return originalLocateFile
        ? originalLocateFile(path, prefix)
        : prefix + path;
    };
  }

  /**
   * Emscripten の仮想ファイルシステム (FS) にリソースをマウントします。
   * 巨大な評価関数ファイル (NNUE等) を WASM から `fopen` で読み込めるようにするために使用します。
   * メインスレッドをブロックしないよう、Worker 起動時の非同期初期化フェーズで呼び出してください。
   *
   * @param moduleInstance 初期化された Emscripten Module インスタンス (FS プロパティを持つもの)
   * @param vfsPath VFS 上の配置パス (例: "/eval.nnue")
   * @param resourceKey ResourceMap のキー (例: "eval.nnue")
   */
  static async mountToVFS(
    moduleInstance: EmscriptenModule,
    vfsPath: string,
    resourceKey: string,
  ): Promise<void> {
    if (!moduleInstance || !moduleInstance.FS) {
      throw new Error("[ResourceInjector] Module instance or FS not found.");
    }

    const blobUrl = this.resolve(resourceKey);
    // 未解決の場合はエラーとする（空ファイルを作っても意味がないため）
    if (blobUrl === resourceKey) {
      console.warn(
        `[ResourceInjector] Resource key "${resourceKey}" was not resolved in map.`,
      );
    }

    try {
      const response = await globalThis.fetch(blobUrl);
      if (!response.ok)
        throw new Error(`Failed to fetch resource: ${response.statusText}`);

      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);

      // 親ディレクトリが必要な場合は作成 (簡易的な階層サポート)
      const parts = vfsPath.split("/").filter((p) => p);
      if (parts.length > 1) {
        let currentPath = "";
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath += "/" + parts[i];
          try {
            moduleInstance.FS.mkdir(currentPath);
          } catch (e: unknown) {
            // ディレクトリが既にある場合は無視 (EEXIST)
            // 2026: 型ガードによる安全なエラーチェック
            if (!this.isFsError(e) || e.code !== "EEXIST") throw e;
          }
        }
      }

      moduleInstance.FS.writeFile(vfsPath, data);
    } catch (error: unknown) {
      throw new Error(
        `[ResourceInjector] Failed to mount "${resourceKey}" to "${vfsPath}": ${error}`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Emscripten FS エラーの型ガード。
   */
  private static isFsError(e: unknown): e is { code: string } {
    return (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code: unknown }).code === "string"
    );
  }
}
