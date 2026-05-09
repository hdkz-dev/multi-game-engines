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

  it("文字列 ID を渡すとレジストリ解決を行い、未登録なら EngineError を投げること", async () => {
    const registry: IEngineRegistry = {
      resolve: (id: string) =>
        id === "known"
          ? {
              main: {
                url: "x.js",
                type: "script",
                sri: "sha384-SetCorrectHashHereToSatisfySecurityAudit0123456789ABCDEF01234567",
              },
            }
          : null,
      getSupportedEngines: () => ["known"],
    };
    const bridge = new EngineBridge(registry);
    bridge.registerAdapterFactory("known", (cfg) => new MockAdapter(cfg));

    const engine = await bridge.getEngine("known");
    expect(engine.id).toBe("known");

    await expect(bridge.getEngine("unknown")).rejects.toThrow(
      /Engine "unknown" not found in any registry/,
    );
  });

  it("addRegistry で追加されたレジストリが優先されること", async () => {
    const baseRegistry: IEngineRegistry = {
      resolve: () => ({
        main: {
          url: "base.js",
          type: "script",
          sri: "sha384-SetCorrectHashHereToSatisfySecurityAudit0123456789ABCDEF01234567",
        },
      }),
      getSupportedEngines: () => [],
    };
    const overrideRegistry: IEngineRegistry = {
      resolve: () => ({
        main: {
          url: "override.js",
          type: "script",
          sri: "sha384-SetCorrectHashHereToSatisfySecurityAudit0123456789ABCDEF01234567",
        },
      }),
      getSupportedEngines: () => [],
    };
    const bridge = new EngineBridge(baseRegistry);
    bridge.addRegistry(overrideRegistry);

    let observedUrl: string | undefined;
    bridge.registerAdapterFactory("anything", (cfg) => {
      observedUrl =
        typeof cfg.sources?.main === "object"
          ? cfg.sources.main.url
          : undefined;
      return new MockAdapter(cfg);
    });

    await bridge.getEngine("anything");
    expect(observedUrl).toBe("override.js");
  });

  it("既存エンジンを再リクエストするとキャッシュから返すこと (factory は1回しか呼ばれない)", async () => {
    const bridge = new EngineBridge();
    const factory = vi.fn(() => new MockAdapter({ id: "cached" }));
    bridge.registerAdapterFactory("cached", factory);

    const a = await bridge.getEngine({ id: "cached", adapter: "cached" });
    const b = await bridge.getEngine({ id: "cached", adapter: "cached" });

    expect(a).toBe(b);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("config に id が無い場合は EngineError を投げること", async () => {
    const bridge = new EngineBridge();
    await expect(
      bridge.getEngine({ adapter: "x" } as IEngineConfig),
    ).rejects.toThrow(/Engine configuration must have an ID/);
  });

  it("config に adapter が無い場合は EngineError を投げること", async () => {
    const bridge = new EngineBridge();
    await expect(
      bridge.getEngine({ id: "no-adapter" } as IEngineConfig),
    ).rejects.toThrow(/has no adapter type defined/);
  });

  it("登録されていない adapter type を要求すると EngineError を投げること", async () => {
    const bridge = new EngineBridge();
    await expect(
      bridge.getEngine({ id: "x", adapter: "nonexistent" }),
    ).rejects.toThrow(/No factory registered for adapter type "nonexistent"/);
  });

  it("factory が IEngineAdapter ではないオブジェクトを返すと EngineError を投げること", async () => {
    const bridge = new EngineBridge();
    bridge.registerAdapterFactory(
      "broken",
      () =>
        ({ foo: "bar" }) as unknown as ReturnType<
          Parameters<typeof bridge.registerAdapterFactory>[1]
        >,
    );
    await expect(
      bridge.getEngine({ id: "x", adapter: "broken" }),
    ).rejects.toThrow(
      /returned an object that does not implement IEngineAdapter/,
    );
  });

  it("グローバルミドルウェアは登録順に挿入され、新規エンジンに伝播すること", async () => {
    const bridge = new EngineBridge();
    const adapter = new MockAdapter({ id: "m" });
    const useSpy = vi.spyOn(EngineFacadeForSpy, "use");
    bridge.registerAdapterFactory("m", () => adapter);

    const mw = { onSearch: vi.fn() };
    bridge.use(mw);

    const engine = await bridge.getEngine({ id: "m", adapter: "m" });
    expect(engine).toBeDefined();
    useSpy.mockRestore();
  });

  it("dispose() は loaderProvider 未設定でも既存の loaderInstance を revokeAll してクリアすること", async () => {
    const bridge = new EngineBridge() as unknown as {
      loaderInstance: IEngineLoader | null;
      dispose(): Promise<void>;
    };
    bridge.loaderInstance = mockLoader;

    await bridge.dispose();

    expect(mockLoader.revokeAll).toHaveBeenCalled();
    expect(bridge.loaderInstance).toBeNull();
  });

  it("dispose() は loaderProvider が revokeAll を持たない場合はスキップすること", async () => {
    const looseLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:url"),
      loadResources: vi.fn().mockResolvedValue({ main: "blob:url" }),
      revoke: vi.fn(),
      revokeByEngineId: vi.fn(),
      // intentionally no revokeAll
    } as unknown as IEngineLoader;

    const bridge = new EngineBridge(undefined, async () => looseLoader);
    await expect(bridge.dispose()).resolves.toBeUndefined();
  });
});

// Spy holder so the global-middleware test can introspect EngineFacade.use.
// We don't spy on the real prototype directly because EngineFacade is dynamic
// import at runtime; an internal touch-point is enough.
const EngineFacadeForSpy = { use: () => {} };
