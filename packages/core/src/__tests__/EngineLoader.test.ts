import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineLoader } from "../bridge/EngineLoader.js";
import { IFileStorage, IEngineSourceConfig } from "../types.js";

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

    // globalThis fetch mock
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode("test").buffer,
    } as unknown as Response);

    // globalThis URL mock
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
    globalThis.URL.revokeObjectURL = vi.fn();
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
      url: "https://fail.js",
      type: "script",
      sri: dummySRI,
      size: 100,
    };

    // 1回目: 失敗させる
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(loader.loadResource("test", config)).rejects.toThrow();

    // 2回目: 成功させる
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode("test").buffer,
    } as Response);

    const url = await loader.loadResource("test", config);
    expect(url).toBe("blob:test");
  });

  it("should allow loading without SRI if __unsafeNoSRI is true", async () => {
    vi.mocked(storage.get).mockResolvedValue(null);
    const config: IEngineSourceConfig = {
      url: "https://test.com/engine.js",
      type: "script",
      __unsafeNoSRI: true,
    };

    const url = await loader.loadResource("test", config);

    expect(url).toBe("blob:test");
    expect(fetch).toHaveBeenCalled();
    // SRI検証（verifySRI）が呼ばれないこと、または呼ばれても成功することを期待（実装上はスキップされる）
  });

  it("should reject __unsafeNoSRI if NODE_ENV is production", async () => {
    // NODE_ENV を本番に偽装
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const config: IEngineSourceConfig = {
        url: "https://test.com/engine.js",
        type: "script",
        __unsafeNoSRI: true,
      };

      await expect(loader.loadResource("test", config)).rejects.toThrow(
        "SRI bypass (__unsafeNoSRI) is not allowed in production",
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
