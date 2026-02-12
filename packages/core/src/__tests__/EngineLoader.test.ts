import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineLoader } from "../bridge/EngineLoader";
import { IFileStorage, IEngineSourceConfig } from "../types";

describe("EngineLoader", () => {
  // 型安全なモックストレージ
  const mockStorage: IFileStorage = {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  };

  const mockConfig: IEngineSourceConfig = {
    url: "https://example.com/engine.js",
    sri: "sha256-validhashbase64==",
    size: 100,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    
    // storage.set が Promise を返すようにデフォルト設定
    vi.mocked(mockStorage.set).mockResolvedValue(undefined);
    vi.mocked(mockStorage.get).mockResolvedValue(null);

    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:test"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("should return cached resource if available", async () => {
    vi.mocked(mockStorage.get).mockResolvedValue(new ArrayBuffer(8));
    const loader = new EngineLoader(mockStorage);
    
    const url = await loader.loadResource("test-engine", mockConfig);
    
    expect(url).toBe("blob:test");
    expect(mockStorage.get).toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("should fetch and cache resource if not in storage", async () => {
    // 2026 Best Practice: Use real Response object instead of mock
    const mockResponse = new Response(new ArrayBuffer(8), { status: 200 });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    const loader = new EngineLoader(mockStorage);
    const url = await loader.loadResource("test-engine", mockConfig);

    expect(url).toBe("blob:test");
    expect(globalThis.fetch).toHaveBeenCalled();
    expect(mockStorage.set).toHaveBeenCalled();
  });

  it("should throw EngineError if SRI is missing", async () => {
    const loader = new EngineLoader(mockStorage);
    const configWithoutSRI = { ...mockConfig, sri: "" };

    await expect(loader.loadResource("test", configWithoutSRI)).rejects.toThrow(/SRI required/);
  });

  it("should throw EngineError if network fetch fails", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("Network fail"));
    const loader = new EngineLoader(mockStorage);

    await expect(loader.loadResource("test", mockConfig)).rejects.toThrow(/Network error/);
  });

  it("should call URL.revokeObjectURL when revoke is called", () => {
    const loader = new EngineLoader(mockStorage);
    loader.revoke("blob:test-url");
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });

  it("should proactively revoke old Blob URL when re-loading the same engine", async () => {
    vi.mocked(mockStorage.get).mockResolvedValue(new ArrayBuffer(8));
    const loader = new EngineLoader(mockStorage);
    
    // 1回目のロード
    const url1 = await loader.loadResource("test-engine", mockConfig);
    expect(url1).toBe("blob:test");

    // 2回目のロード。この時、1回目の URL が revoke されるはず。
    await loader.loadResource("test-engine", mockConfig);
    
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(url1);
  });

  it("should support loading multiple resources atomically via loadResources", async () => {
    vi.mocked(mockStorage.get).mockResolvedValue(new ArrayBuffer(8));
    const loader = new EngineLoader(mockStorage);
    
    const configs = {
      main: mockConfig,
      extra: { ...mockConfig, url: "https://extra.com", sri: "sha256-another==" }
    };

    const urls = await loader.loadResources("test-engine", configs);
    
    expect(urls.main).toBe("blob:test");
    expect(urls.extra).toBe("blob:test");
    expect(mockStorage.get).toHaveBeenCalledTimes(2);
  });
});
