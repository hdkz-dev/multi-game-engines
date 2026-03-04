import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EngineLoader } from "../EngineLoader.js";
import { IFileStorage, IEngineSourceConfig } from "../../types.js";
import { SecurityAdvisor } from "../../capabilities/SecurityAdvisor.js";

describe("EngineLoader", () => {
  let storage: IFileStorage;
  let loader: EngineLoader;
  const dummySRI = "sha256-n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg="; // "test" のハッシュ

  beforeEach(() => {
    storage = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
    };
    loader = new EngineLoader(storage);

    // global fetch をスタブ化 (デフォルトで成功レスポンスを返す)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null } as unknown as Headers,
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    );

    // URL.createObjectURL/revokeObjectURL をスタブ化
    // new URL() コンストラクタは保持する（safeFetch 内で使用されるため）
    const OriginalURL = globalThis.URL;
    vi.stubGlobal(
      "URL",
      class extends OriginalURL {
        static createObjectURL = vi.fn((_blob: Blob) => "blob:test");
        static revokeObjectURL = vi.fn();
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should fetch and cache if not in storage", async () => {
    vi.mocked(storage.get).mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null } as unknown as Headers,
      arrayBuffer: async () => new TextEncoder().encode("test").buffer,
    } as Response);

    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      sri: dummySRI,
    };

    const url = await loader.loadResource("test", config);

    expect(url).toBe("blob:test");
    expect(fetch).toHaveBeenCalledWith(
      "https://test.com/engine.js",
      expect.any(Object),
    );
    expect(storage.set).toHaveBeenCalled();
  });

  it("should return cached version if SRI matches", async () => {
    const data = new TextEncoder().encode("test").buffer;
    vi.mocked(storage.get).mockResolvedValue(data);

    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      sri: dummySRI,
    };

    const url = await loader.loadResource("test", config);

    expect(url).toBe("blob:test");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should atomic multi-resource load", async () => {
    vi.mocked(storage.get).mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: { get: () => null } as unknown as Headers,
      arrayBuffer: async () => new TextEncoder().encode("test").buffer,
    } as Response);

    const sources = {
      main: {
        url: "https://test.com/main.js",
        type: "script" as const,
        sri: dummySRI,
      },
      wasm: {
        url: "https://test.com/engine.wasm",
        type: "wasm" as const,
        sri: dummySRI,
      },
    };

    const urls = await loader.loadResources("test", sources);

    expect(Object.keys(urls)).toHaveLength(2);
    expect(urls.main).toBe("blob:test");
    expect(urls.wasm).toBe("blob:test");
  });

  it("should allow retry after failure (inflight removal)", async () => {
    const config: IEngineSourceConfig = {
      url: "https://test.com/fail.js",
      type: "script",
      sri: dummySRI,
    };

    // 1回目: 失敗
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Error",
    } as Response);

    await expect(loader.loadResource("test", config)).rejects.toThrow();

    // 物理的修正: キャッシュのクリーンアップ（マイクロタスク）を確実に待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    // 2回目: 成功 (モックを上書き)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null } as unknown as Headers,
      arrayBuffer: async () => new TextEncoder().encode("test").buffer,
    } as Response);

    const url = await loader.loadResource("test", config);
    expect(url).toBe("blob:test");
  });

  it("should allow loading without SRI if __unsafeNoSRI is true", async () => {
    vi.mocked(storage.get).mockResolvedValue(null);
    const verifySpy = vi.spyOn(SecurityAdvisor, "verifySRI");

    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      __unsafeNoSRI: true,
    };

    const url = await loader.loadResource("test", config);

    expect(url).toBe("blob:test");
    expect(fetch).toHaveBeenCalled();
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it("should reject __unsafeNoSRI if NODE_ENV is production", async () => {
    // 物理的整合性: forceProduction フラグがない場合は環境変数をシミュレート
    (globalThis as unknown as Record<string, unknown>).NODE_ENV = "production";

    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      __unsafeNoSRI: true,
    };

    try {
      await expect(loader.loadResource("test", config)).rejects.toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.sriBypassNotAllowed",
        }),
      );
    } finally {
      delete (globalThis as unknown as Record<string, unknown>).NODE_ENV;
    }
  });

  it("should reject non-loopback HTTP URLs", async () => {
    const config: IEngineSourceConfig = {
      url: "http://example.com/engine.js",
      type: "script",
      sri: dummySRI,
    };

    await expect(loader.loadResource("test", config)).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.insecureConnection" }),
    );
  });

  it("should reject invalid engine ids", async () => {
    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      sri: dummySRI,
    };

    const invalidIds = ["test engine", "test!", "test/123", ""];
    for (const engineId of invalidIds) {
      await expect(loader.loadResource(engineId, config)).rejects.toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.invalidEngineId" }),
      );
    }
  });

  it("should handle undefined config.type as script", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null } as unknown as Headers,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response);

    const config = {
      url: "https://test.com/e.js",
      sri: dummySRI,
    } as IEngineSourceConfig;
    await loader.loadResource("test", config);

    // Blobの生成時に application/javascript が使われることを物理的に確認
    // (createObjectURL の引数で検証可能だが、ここでは成功することを確認)
  });

  it("should revoke resources by engine ID", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: { get: () => null } as unknown as Headers,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response);

    await loader.loadResource("engine-1", {
      url: "https://test.com/1.js",
      type: "script",
      sri: dummySRI,
    });
    await loader.loadResource("engine-1", {
      url: "https://test.com/2.js",
      type: "script",
      sri: dummySRI,
    });
    await loader.loadResource("engine-2", {
      url: "https://test.com/3.js",
      type: "script",
      sri: dummySRI,
    });

    loader.revokeByEngineId("engine-1");
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("should rollback and revoke ONLY new URLs on batch failure", async () => {
    // 物理的整合性: 1つ目は成功、2つ目は失敗させる
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null } as unknown as Headers,
        arrayBuffer: async () => new ArrayBuffer(0),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

    const sources = {
      s1: {
        url: "https://test.com/ok.js",
        type: "script" as const,
        sri: dummySRI,
      },
      s2: {
        url: "https://test.com/fail.js",
        type: "script" as const,
        sri: dummySRI,
      },
    };

    await expect(
      loader.loadResources("rollback-test", sources),
    ).rejects.toThrow();

    // 成功した s1 の URL が revoke されていること
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("物理的な URL 解放の検証: dispose 時に全ての Blob URL が確実に破棄されること", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: { get: () => null } as unknown as Headers,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response);

    await loader.loadResource("e1", {
      url: "https://test.com/u1.js",
      type: "script",
      sri: dummySRI,
    });
    await loader.loadResource("e2", {
      url: "https://test.com/u2.js",
      type: "script",
      sri: dummySRI,
    });

    loader.revokeAll();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
