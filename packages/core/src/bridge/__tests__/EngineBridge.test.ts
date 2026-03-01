import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { EngineBridge } from "../EngineBridge.js";
import {
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IProtocolParser,
  IMiddleware,
  EngineStatus,
  MiddlewarePriority,
  IEngineConfig,
} from "../../types.js";
import { createMove } from "../../protocol/ProtocolValidator.js";

describe("EngineBridge", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const createMockAdapter = (
    id: string,
  ): IEngineAdapter<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  > => ({
    id,
    name: `Mock ${id}`,
    version: "1.0.0",
    status: "ready" as EngineStatus,
    parser: {
      createSearchCommand: vi.fn().mockReturnValue(["go"]),
      createStopCommand: vi.fn().mockReturnValue("stop"),
      createOptionCommand: vi.fn().mockReturnValue("setoption"),
      parseInfo: vi.fn(),
      parseResult: vi.fn(),
    } satisfies IProtocolParser<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >,
    load: vi.fn().mockResolvedValue(undefined),
    updateStatus: vi.fn(),
    search: vi.fn().mockResolvedValue({
      bestMove: createMove("e2e4"),
    }),
    searchRaw: vi.fn().mockImplementation(() => ({
      info: (async function* () {
        yield { depth: 1 } as IBaseSearchInfo;
      })(),
      result: Promise.resolve({
        bestMove: createMove("e2e4"),
      } as IBaseSearchResult),
      stop: vi.fn(),
    })),
    stop: vi.fn().mockResolvedValue(undefined),
    setBook: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn().mockResolvedValue(undefined),
    onStatusChange: vi.fn().mockReturnValue(() => {}),
    onInfo: vi.fn().mockReturnValue(() => {}),
    onSearchResult: vi.fn().mockReturnValue(() => {}),
    onProgress: vi.fn().mockReturnValue(() => {}),
    onTelemetry: vi.fn().mockReturnValue(() => {}),
    emitTelemetry: vi.fn(),
    setOption: vi.fn().mockResolvedValue(undefined),
  });

  it("アダプターを登録し、getEngine で取得できること", async () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("test");

    await bridge.registerAdapter(adapter);
    const engine = await bridge.getEngine("test");

    expect(engine.id).toBe("test");
    expect(engine.name).toBe("Mock test");
  });

  it("存在しないエンジンを取得しようとするとエラーを投げること", async () => {
    const bridge = new EngineBridge();
    // type-safe way to test invalid engine
    await expect(
      bridge.getEngine("invalid-engine-id" as string),
    ).rejects.toThrow();
  });

  it("アダプターの登録解除ができること", async () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("test");

    await bridge.registerAdapter(adapter);
    await bridge.unregisterAdapter("test");

    expect(adapter.dispose).toHaveBeenCalled(); // 確実に dispose されていること
    await expect(bridge.getEngine("test")).rejects.toThrow();
  });

  it("同一 ID でアダプターを登録した際、古い方が破棄されること (Leak Prevention)", async () => {
    const bridge = new EngineBridge();
    const adapter1 = createMockAdapter("engine1");
    const adapter2 = createMockAdapter("engine1"); // 同じ ID

    await bridge.registerAdapter(adapter1);
    await bridge.registerAdapter(adapter2);

    expect(adapter1.dispose).toHaveBeenCalled(); // 古い方が破棄されていること
    expect(adapter2.dispose).not.toHaveBeenCalled(); // 新しい方は生きている

    const engine = await bridge.getEngine("engine1");
    expect(engine.id).toBe("engine1");
  });

  it("getEngine が同じ ID に対して同じインスタンスを返すこと (Caching)", async () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("engine1");
    await bridge.registerAdapter(adapter);

    const instance1 = await bridge.getEngine("engine1");
    const instance2 = await bridge.getEngine("engine1");

    expect(instance1).toBe(instance2);

    // ミドルウェアを追加
    bridge.use({
      onCommand: async (c) => c,
    } as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    // キャッシュがクリアされ、新しいインスタンスが返されるはず
    const instance3 = await bridge.getEngine("engine1");
    expect(instance3).not.toBe(instance1);
  });

  it("ID の代わりに EngineConfig オブジェクトを直接渡してエンジンを取得できること", async () => {
    const bridge = new EngineBridge();
    const config: IEngineConfig = {
      id: "dynamic-engine",
      adapter: "test",
      sources: { main: { url: "test.js", type: "script", sri: "sha256-..." } },
    };

    // アダプターファクトリが必要
    bridge.registerAdapterFactory("test", (cfg) => {
      const adapter = createMockAdapter(cfg.id!);
      return Promise.resolve(adapter);
    });

    const engine = await bridge.getEngine(config);
    expect(engine.id).toBe("dynamic-engine");
  });

  it("存在しないアダプタータイプを指定した場合にエラーを投げること", async () => {
    const bridge = new EngineBridge();
    const config: IEngineConfig = {
      id: "unknown-adapter-engine",
      adapter: "non-existent",
    };

    await expect(bridge.getEngine(config)).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.adapterNotFound" }),
    );
  });

  it("同一 ID で複数回 getEngine しても、内部アダプターが同じであればインスタンスが再利用されること", async () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("engine1");
    await bridge.registerAdapter(adapter);

    const e1 = await bridge.getEngine("engine1");
    const e2 = await bridge.getEngine("engine1");
    expect(e1).toBe(e2);
  });

  describe("Registry Chain (LIFO)", () => {
    it("should resolve metadata from the most recently added registry", async () => {
      const bridge = new EngineBridge();

      const registry1 = {
        resolve: vi
          .fn()
          .mockReturnValue({ main: { url: "v1.js", type: "worker-js" } }),
        getSupportedEngines: () => ["engine1"],
      };
      const registry2 = {
        resolve: vi
          .fn()
          .mockReturnValue({ main: { url: "v2.js", type: "worker-js" } }),
        getSupportedEngines: () => ["engine1"],
      };

      bridge.addRegistry(registry1);
      bridge.addRegistry(registry2);

      // Access private method for testing using type-safe double casting
      const config = (
        bridge as unknown as {
          resolveEngineConfig: (id: string | IEngineConfig) => IEngineConfig;
        }
      ).resolveEngineConfig("engine1");
      expect(config.sources?.main.url).toBe("v2.js");
      expect(registry2.resolve).toHaveBeenCalled();
      expect(registry1.resolve).not.toHaveBeenCalled(); // LIFO: found in registry2
    });

    it("should fallback to earlier registries if not found in recent ones", async () => {
      const bridge = new EngineBridge();

      const registry1 = {
        resolve: vi
          .fn()
          .mockReturnValue({ main: { url: "v1.js", type: "worker-js" } }),
        getSupportedEngines: () => ["engine1"],
      };
      const registry2 = {
        resolve: vi.fn().mockReturnValue(null),
        getSupportedEngines: () => [],
      };

      bridge.addRegistry(registry1);
      bridge.addRegistry(registry2);

      const config = (
        bridge as unknown as {
          resolveEngineConfig: (id: string | IEngineConfig) => IEngineConfig;
        }
      ).resolveEngineConfig("engine1");
      expect(config.sources?.main.url).toBe("v1.js");
      expect(registry2.resolve).toHaveBeenCalled();
      expect(registry1.resolve).toHaveBeenCalled();
    });
  });

  it("should filter middlewares based on supportedEngines", async () => {
    const bridge = new EngineBridge();

    await bridge.registerAdapter(createMockAdapter("engine-a"));
    await bridge.registerAdapter(createMockAdapter("engine-b"));
    await bridge.registerAdapter(createMockAdapter("engine-c"));

    const mwGlobal: IMiddleware<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    > = {
      priority: MiddlewarePriority.HIGH,
      onCommand: vi.fn().mockImplementation(async (c) => c),
    };
    bridge.use(mwGlobal);

    const mwSpecificA: IMiddleware<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    > = {
      priority: MiddlewarePriority.NORMAL,
      supportedEngines: ["engine-a"],
      onCommand: vi.fn().mockImplementation(async (c) => c),
    };
    bridge.use(mwSpecificA);

    const engineA = await bridge.getEngine("engine-a");
    await engineA.search({} as IBaseSearchOptions);
    expect(mwGlobal.onCommand).toHaveBeenCalled();
    expect(mwSpecificA.onCommand).toHaveBeenCalled();

    vi.clearAllMocks();

    const engineB = await bridge.getEngine("engine-b");
    await engineB.search({} as IBaseSearchOptions);
    expect(mwGlobal.onCommand).toHaveBeenCalled();
    expect(mwSpecificA.onCommand).not.toHaveBeenCalled();
  });

  describe("dispose()", () => {
    it("bridge.dispose() が全アダプターを破棄し、ローダーをクリーンアップすること", async () => {
      const bridge = new EngineBridge();
      const adapter1 = createMockAdapter("engine1");
      const adapter2 = createMockAdapter("engine2");

      await bridge.registerAdapter(adapter1);
      await bridge.registerAdapter(adapter2);

      // Mock loader
      const mockLoader = {
        revokeAll: vi.fn(),
        revokeByEngineId: vi.fn(),
      };
      (bridge as unknown as { loader: unknown }).loader = mockLoader;

      await bridge.dispose();

      expect(adapter1.dispose).toHaveBeenCalled();
      expect(adapter2.dispose).toHaveBeenCalled();
      expect(mockLoader.revokeAll).toHaveBeenCalled();
    });

    it("アダプターの破棄に失敗しても、ローダーのクリーンアップが実行されること", async () => {
      const bridge = new EngineBridge();
      const adapter = createMockAdapter("engine1");
      adapter.dispose = vi.fn().mockRejectedValue(new Error("disposal failed"));

      await bridge.registerAdapter(adapter);

      const mockLoader = {
        revokeAll: vi.fn(),
        revokeByEngineId: vi.fn(),
      };
      (bridge as unknown as { loader: unknown }).loader = mockLoader;

      await bridge.dispose();

      expect(adapter.dispose).toHaveBeenCalled();
      expect(mockLoader.revokeAll).toHaveBeenCalled();
    });

    it("複数回 dispose() を呼んでも安全であること (Idempotency)", async () => {
      const bridge = new EngineBridge();
      const adapter = createMockAdapter("engine1");
      await bridge.registerAdapter(adapter);

      const mockLoader = {
        revokeAll: vi.fn(),
        revokeByEngineId: vi.fn(),
      };
      (bridge as unknown as { loader: unknown }).loader = mockLoader;

      await bridge.dispose();
      await bridge.dispose();

      expect(adapter.dispose).toHaveBeenCalledTimes(1);
      expect(mockLoader.revokeAll).toHaveBeenCalledTimes(1);
    });
  });
});
