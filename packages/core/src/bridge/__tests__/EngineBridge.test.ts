import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineBridge } from "../EngineBridge.js";
import { BaseAdapter } from "../../adapters/BaseAdapter.js";
import {
  IEngineConfig,
  ILicenseInfo,
} from "../../types.js";

const mockLicense: ILicenseInfo = { name: "MIT", url: "" };

function createMockAdapter(id: string, name = "Mock engine") {
  class MockAdapter extends BaseAdapter {
    readonly version = "1.0.0";
    readonly engineLicense = mockLicense;
    readonly adapterLicense = mockLicense;
    readonly parser = {
      createSearchCommand: vi.fn().mockReturnValue("go"),
      createStopCommand: vi.fn().mockReturnValue("stop"),
      createOptionCommand: vi.fn().mockReturnValue("setoption"),
      parseInfo: vi.fn(),
      parseResult: vi.fn(),
      isReadyCommand: "isready",
      readyResponse: "readyok",
    };

    constructor() {
      // 物理的な ID/Name を親クラスに渡す。自身のプロパティとしては定義しない。
      super(id, name, {});
    }

    protected async onInitialize() {}
    protected async onSearchRaw() {}
    protected async onStop() {}
    protected async onDispose() {}
    protected async onBookLoaded() {}
    public async load() {
      this.emitStatusChange("ready");
    }
  }
  return new MockAdapter();
}

describe("EngineBridge", () => {
  let mockLoader: unknown;

  beforeEach(() => {
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue({ main: "blob:url" }),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
  });

  it("アダプターを登録し、getEngine で取得できること", async () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("test", "Mock test");

    bridge.registerAdapterFactory("test-type", () => adapter);

    const engine = await bridge.getEngine({
      id: "test",
      adapter: "test-type",
    });

    expect(engine.id).toBe("test");
    expect(engine.name).toBe("Mock test");
  });

  it("ID の代わりに EngineConfig オブジェクトを直接渡してエンジンを取得できること", async () => {
    const bridge = new EngineBridge();
    const config: IEngineConfig = {
      id: "dynamic-engine",
      adapter: "test",
      sources: {
        main: {
          url: "test.js",
          type: "script",
          sri: "sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
        },
      },
    };

    bridge.registerAdapterFactory("test", (cfg) => {
      return createMockAdapter(cfg.id!, cfg.name);
    });

    const engine = await bridge.getEngine(config);
    expect(engine.id).toBe("dynamic-engine");
  });

  it("bridge.dispose() が全アダプターを破棄し、ローダーをクリーンアップすること", async () => {
    const bridge = new EngineBridge([], () => Promise.resolve(mockLoader));
    const adapter1 = createMockAdapter("e1");
    const adapter2 = createMockAdapter("e2");

    vi.spyOn(adapter1, "dispose");
    vi.spyOn(adapter2, "dispose");

    bridge.registerAdapterFactory("t1", () => adapter1);
    bridge.registerAdapterFactory("t2", () => adapter2);

    await bridge.getEngine({ id: "e1", adapter: "t1" });
    await bridge.getEngine({ id: "e2", adapter: "t2" });

    await bridge.dispose();

    expect(adapter1.dispose).toHaveBeenCalled();
    expect(adapter2.dispose).toHaveBeenCalled();
    expect(mockLoader.revokeAll).toHaveBeenCalled();
  });
});
