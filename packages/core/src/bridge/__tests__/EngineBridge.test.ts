import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineBridge } from "../EngineBridge.js";
import { MockAdapter } from "../../mocks/MockAdapter.js";
import { IEngineConfig, IEngineRegistry, IEngineLoader } from "../../types.js";

describe("EngineBridge", () => {
  let mockLoader: IEngineLoader;

  beforeEach(() => {
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:url"),
      loadResources: vi.fn().mockResolvedValue({ main: "blob:url" }),
      revoke: vi.fn(),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
  });

  it("アダプターを登録し、getEngine で取得できること", async () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter({ id: "test", name: "Mock test" });

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
          sri: "sha384-SetCorrectHashHereToSatisfySecurityAudit0123456789ABCDEF01234567",
        },
      },
    };

    bridge.registerAdapterFactory("test", (cfg) => {
      return new MockAdapter(cfg);
    });

    const engine = await bridge.getEngine(config);
    expect(engine.id).toBe("dynamic-engine");
  });

  it("bridge.dispose() が全アダプターを破棄し、ローダーをクリーンアップすること", async () => {
    const emptyRegistry: IEngineRegistry = {
      resolve: () => null,
      getSupportedEngines: () => [],
    };
    const bridge = new EngineBridge(emptyRegistry, async () => mockLoader);
    const adapter1 = new MockAdapter({ id: "e1" });
    const adapter2 = new MockAdapter({ id: "e2" });

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
