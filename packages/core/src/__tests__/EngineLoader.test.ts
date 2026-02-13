import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineLoader } from "../bridge/EngineLoader.js";
import { IFileStorage, IEngineSourceConfig } from "../types.js";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor.js";

describe("EngineLoader", () => {
  // 型安全なモックストレージ
  const mockStorage: IFileStorage = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    clear: vi.fn(),
  };

  const dummyConfig: IEngineSourceConfig = {
    url: "https://example.com/engine.js",
    sri: "sha256-validhashbase64==",
    size: 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob://test"),
      revokeObjectURL: vi.fn(),
    });
    // SRI検証をデフォルトで成功させる
    vi.spyOn(SecurityAdvisor, "verifySRI").mockResolvedValue(true);
  });

  it("キャッシュに存在しない場合、ネットワークから取得して保存すること", async () => {
    const loader = new EngineLoader(mockStorage);
    vi.mocked(mockStorage.get).mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
    } as Response);

    const url = await loader.loadResource("test", dummyConfig);

    expect(url).toBe("blob://test");
    expect(fetch).toHaveBeenCalled();
    expect(mockStorage.set).toHaveBeenCalled();
  });

  it("キャッシュに存在する場合、それを使用すること", async () => {
    const loader = new EngineLoader(mockStorage);
    vi.mocked(mockStorage.get).mockResolvedValue(new ArrayBuffer(10));

    const url = await loader.loadResource("test", dummyConfig);

    expect(url).toBe("blob://test");
    // キャッシュヒット時は fetch しない
    expect(fetch).not.toHaveBeenCalled();
  });

  it("SRI が指定されていない場合にエラーを投げること", async () => {
    const loader = new EngineLoader(mockStorage);
    const config = { ...dummyConfig, sri: "" };

    await expect(loader.loadResource("test", config)).rejects.toThrow(/SRI required/);
  });
});
