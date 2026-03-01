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

    // Mock window.location
    vi.stubGlobal("window", {
      location: {
        href: "https://test.com/index.html",
        origin: "https://test.com",
      },
    });

    // globalThis fetch mock
    globalThis.fetch = vi.fn<() => Promise<Response>>().mockResolvedValue({
      ok: true,
      headers: { get: () => null } as unknown as Headers,
      arrayBuffer: async () => new TextEncoder().encode("test").buffer,
    } as Response);

    // globalThis URL mock
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
    globalThis.URL.revokeObjectURL = vi.fn();

    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should fetch and cache if not in storage", async () => {
    vi.mocked(storage.get).mockResolvedValue(null);
    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      sri: dummySRI,
      size: 100,
    };

    const url = await loader.loadResource("test", config);

    expect(url).toBe("blob:test");
    expect(storage.set).toHaveBeenCalled();
  });

  it("should return cached version if SRI matches", async () => {
    const data = new TextEncoder().encode("test").buffer;
    vi.mocked(storage.get).mockResolvedValue(data);
    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      sri: dummySRI,
      size: 100,
    };

    const url = await loader.loadResource("test", config);

    expect(url).toBe("blob:test");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should atomic multi-resource load", async () => {
    const configs: Record<string, IEngineSourceConfig> = {
      main: {
        url: "https://test.com/main.js",
        type: "script",
        sri: dummySRI,
        size: 100,
      },
      weights: {
        url: "https://test.com/weights.bin",
        type: "wasm",
        sri: dummySRI,
        size: 200,
      },
    };

    const urls = await loader.loadResources("test", configs);

    expect(urls.main).toBe("blob:test");
    expect(urls.weights).toBe("blob:test");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("should allow retry after failure (inflight removal)", async () => {
    const config: IEngineSourceConfig = {
      url: "https://test.com/fail.js",
      type: "script",
      sri: dummySRI,
      size: 100,
    };

    // 1回目: 失敗させる
    const errRes = {
      ok: false,
      status: 500,
      headers: { get: () => null } as unknown as Headers,
      statusText: "Internal Server Error",
    } as Response;
    vi.mocked(fetch)
      .mockResolvedValueOnce(errRes)
      .mockResolvedValueOnce(errRes)
      .mockResolvedValueOnce(errRes);

    await expect(loader.loadResource("test", config)).rejects.toThrow();

    // 2回目: 成功させる
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
    // SRI検証がスキップされていることを確認
    expect(verifySpy).not.toHaveBeenCalled();

    verifySpy.mockRestore();
  });

  it("should reject __unsafeNoSRI if NODE_ENV is production", async () => {
    // NODE_ENV を本番に偽装
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      // コンストラクタで環境変数を読むため、再インスタンス化が必要
      const prodLoader = new EngineLoader(storage);
      const config: IEngineSourceConfig = {
        url: "https://test.com/engine.js",
        type: "script",
        __unsafeNoSRI: true,
      };

      await expect(prodLoader.loadResource("test", config)).rejects.toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.sriBypassNotAllowed",
        }),
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("should reject non-loopback HTTP URLs", async () => {
    const config: IEngineSourceConfig = {
      url: "http://malicious.com/engine.js",
      type: "script",
      sri: dummySRI,
    };

    await expect(loader.loadResource("test", config)).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.insecureConnection" }),
    );
  });

  it("should reject invalid engine ids", async () => {
    // 全て特殊文字のID
    const engineId = "!!!@@@";
    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      sri: dummySRI,
    };

    await expect(loader.loadResource(engineId, config)).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.invalidEngineId" }),
    );
  });

  it("should handle undefined config.type as script", async () => {
    const config = {
      url: "https://test.com/engine.js",
      sri: dummySRI,
    } as unknown as IEngineSourceConfig; // type を意図的に省略

    const url = await loader.loadResource("test", config);
    expect(url).toBe("blob:test");
    // デフォルトで JS として扱われ、オリジン検証が走る
  });

  it("should revoke resources by engine ID", async () => {
    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      sri: dummySRI,
    };

    // Load multiple resources for the same engine
    await loader.loadResource("engine-1", config);
    await loader.loadResource("engine-1", {
      ...config,
      url: "https://test.com/worker.js",
    });
    // Load a resource for a different engine
    await loader.loadResource("engine-2", config);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(3);

    // Revoke resources for engine-1
    loader.revokeByEngineId("engine-1");

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);

    // engine-2's resources should NOT be revoked yet
    // engine-1 had 2 resources, engine-2 had 1. Total created = 3. Total revoked = 2.
    // The specific blob for engine-2 should not have been passed to revokeObjectURL yet.
    // We assume the blob URLs are predictable or we can check what was NOT called.
    // Since we mock return "blob:test" for all, we can't distinguish by URL value alone in this mock setup.
    // However, we can verifying the count is correct (2 calls for engine-1).

    // Now revoke engine-2
    loader.revokeByEngineId("engine-2");
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
  });

  it("should rollback and revoke ONLY new URLs on batch failure", async () => {
    const configs: Record<string, IEngineSourceConfig> = {
      existing: {
        url: "https://test.com/existing.js",
        type: "script",
        sri: dummySRI,
      },
      newOne: {
        url: "https://test.com/new.js",
        type: "script",
        sri: dummySRI,
      },
      failing: {
        url: "https://test.com/fail.js",
        type: "script",
        sri: dummySRI,
      },
    };

    // 1. まず1つだけ正常にロードしてキャッシュさせる
    vi.mocked(globalThis.URL.createObjectURL).mockReturnValueOnce(
      "blob:existing",
    );
    await loader.loadResource("test", configs.existing!);
    const revokeSpy = vi.mocked(globalThis.URL.revokeObjectURL);
    revokeSpy.mockClear();

    // 2回目以降の createObjectURL の戻り値を分ける
    vi.mocked(globalThis.URL.createObjectURL)
      .mockReturnValueOnce("blob:new")
      .mockReturnValueOnce("blob:fail");

    // 2. バッチロードを実行。3つ目のリソースを失敗させる
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (url.toString().includes("fail.js")) {
        return {
          ok: false,
          status: 500,
          headers: { get: () => null } as unknown as Headers,
        } as Response;
      }
      return {
        ok: true,
        headers: { get: () => null } as unknown as Headers,
        arrayBuffer: async () => new TextEncoder().encode("test").buffer,
      } as Response;
    });

    await expect(loader.loadResources("test", configs)).rejects.toThrow();

    // 3. 検証:
    // - "existing" は既にあったので revoke されないはず
    // - "newOne" は新しく作られたので revoke されるはず
    expect(revokeSpy).toHaveBeenCalledWith("blob:new");
    expect(revokeSpy).not.toHaveBeenCalledWith("blob:existing");
  });

  it("物理的な URL 解放の検証: dispose 時に全ての Blob URL が確実に破棄されること", async () => {
    const revokeSpy = vi.mocked(globalThis.URL.revokeObjectURL);

    await loader.loadResource("engine-a", {
      url: "https://test.com/a.js",
      type: "script",
      sri: dummySRI,
    });
    await loader.loadResource("engine-b", {
      url: "https://test.com/b.js",
      type: "script",
      sri: dummySRI,
    });

    expect(revokeSpy).not.toHaveBeenCalled();

    loader.revokeAll();

    // 全てのエンジンに関連するリソースが解放されていること
    expect(revokeSpy).toHaveBeenCalledTimes(2);
  });
});
