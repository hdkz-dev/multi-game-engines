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
    const config: IEngineSourceConfig = { url: "http://test.com/engine.js", sri: dummySRI, size: 100 };
    
    const url = await loader.loadResource("test", config);
    
    expect(url).toBe("blob:test");
    expect(storage.set).toHaveBeenCalled();
  });

  it("should return cached version if SRI matches", async () => {
    const data = new TextEncoder().encode("test").buffer;
    vi.mocked(storage.get).mockResolvedValue(data);
    const config: IEngineSourceConfig = { url: "http://test.com/engine.js", sri: dummySRI, size: 100 };

    const url = await loader.loadResource("test", config);
    
    expect(url).toBe("blob:test");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should atomic multi-resource load", async () => {
    const configs: Record<string, IEngineSourceConfig> = {
      main: { url: "http://test.com/main.js", sri: dummySRI, size: 100 },
      weights: { url: "http://test.com/weights.bin", sri: dummySRI, size: 200 },
    };

    const urls = await loader.loadResources("test", configs);
    
    expect(urls.main).toBe("blob:test");
    expect(urls.weights).toBe("blob:test");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
