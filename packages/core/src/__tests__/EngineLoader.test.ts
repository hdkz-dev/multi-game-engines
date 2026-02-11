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
    const mockResponse = {
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const loader = new EngineLoader(mockStorage);
    const url = await loader.loadResource("test-engine", mockConfig);

    expect(url).toBe("blob:test");
    expect(globalThis.fetch).toHaveBeenCalled();
    expect(mockStorage.set).toHaveBeenCalled();
  });
});
