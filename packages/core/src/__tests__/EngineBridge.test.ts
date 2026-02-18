import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { EngineBridge } from "../bridge/EngineBridge.js";
import {
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IProtocolParser,
  IMiddleware,
  EngineStatus,
  MiddlewarePriority,
  Move,
} from "../types.js";

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
    searchRaw: vi.fn().mockImplementation(() => ({
      info: (async function* () {
        yield { depth: 1, scoreValue: 10 } as IBaseSearchInfo;
      })(),
      result: Promise.resolve({
        bestMove: "e2e4" as Move,
      } as IBaseSearchResult),
      stop: vi.fn(),
    })),
    stop: vi.fn().mockResolvedValue(undefined),
    setOption: vi.fn().mockResolvedValue(undefined),
    onStatusChange: vi.fn().mockReturnValue(() => {}),
    onInfo: vi.fn().mockReturnValue(() => {}),
    onSearchResult: vi.fn().mockReturnValue(() => {}),
    onProgress: vi.fn().mockReturnValue(() => {}),
    onTelemetry: vi.fn().mockReturnValue(() => {}),
    emitTelemetry: vi.fn(),
    dispose: vi.fn().mockResolvedValue(undefined),
  });

  it("アダプターを登録し、getEngine で取得できること", async () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("test");

    await bridge.registerAdapter(adapter);
    const engine = bridge.getEngine("test");

    expect(engine.id).toBe("test");
    expect(engine.name).toBe("Mock test");
  });

  it("存在しないエンジンを取得しようとするとエラーを投げること", () => {
    const bridge = new EngineBridge();
    expect(() => bridge.getEngine("invalid")).toThrow();
  });

  it("アダプターの登録解除ができること", async () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("test");

    await bridge.registerAdapter(adapter);
    await bridge.unregisterAdapter("test");

    expect(adapter.dispose).toHaveBeenCalled(); // 確実に dispose されていること
    expect(() => bridge.getEngine("test")).toThrow();
  });

  it("同一 ID でアダプターを登録した際、古い方が破棄されること (Leak Prevention)", async () => {
    const bridge = new EngineBridge();
    const adapter1 = createMockAdapter("engine1");
    const adapter2 = createMockAdapter("engine1"); // 同じ ID

    await bridge.registerAdapter(adapter1);
    await bridge.registerAdapter(adapter2);

    expect(adapter1.dispose).toHaveBeenCalled(); // 古い方が破棄されていること
    expect(adapter2.dispose).not.toHaveBeenCalled(); // 新しい方は生きている

    const engine = bridge.getEngine("engine1");
    expect(engine.name).toBe("Mock engine1");
  });

  it("dispose 時に全てのアダプターが破棄されること", async () => {
    const bridge = new EngineBridge();
    const adapter1 = createMockAdapter("engine1");
    const adapter2 = createMockAdapter("engine2");

    await bridge.registerAdapter(adapter1);
    await bridge.registerAdapter(adapter2);

    await bridge.dispose();

    expect(adapter1.dispose).toHaveBeenCalled();
    expect(adapter2.dispose).toHaveBeenCalled();
  });

  it("getEngine が同じ ID に対して同じインスタンスを返すこと (Caching)", async () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("engine1");
    await bridge.registerAdapter(adapter);

    const instance1 = bridge.getEngine("engine1");
    const instance2 = bridge.getEngine("engine1");

    expect(instance1).toBe(instance2);

    // ミドルウェアを追加
    bridge.use({
      onCommand: async (c) => c,
    } as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    // キャッシュがクリアされ、新しいインスタンスが返されるはず
    const instance3 = bridge.getEngine("engine1");
    expect(instance3).not.toBe(instance1);
  });

  it("GC されたエンジンインスタンスがカウントからパージされること", async () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("leak-test");
    await bridge.registerAdapter(adapter);

    // インスタンスを生成
    bridge.getEngine("leak-test");

    // この時点で count は 1
    expect(bridge.getActiveEngineCount()).toBe(1);

    // 注意: 実際の GC を待つ代わりに内部の WeakRef をモックして purge を検証
    // プライベートプロパティへのアクセスのため unknown キャストを使用 (テスト用)
    const engineInstances = (
      bridge as unknown as {
        engineInstances: Map<string, { deref: () => unknown }>;
      }
    ).engineInstances;

    const ref = engineInstances.get("leak-test");
    if (ref) {
      vi.spyOn(ref, "deref").mockReturnValue(undefined);
    }

    expect(bridge.getActiveEngineCount()).toBe(0);
    expect(engineInstances.has("leak-test")).toBe(false);
  });

  it("should filter middlewares based on supportedEngines", async () => {
    const bridge = new EngineBridge();

    await bridge.registerAdapter(createMockAdapter("engine-a"));
    await bridge.registerAdapter(createMockAdapter("engine-b"));
    await bridge.registerAdapter(createMockAdapter("engine-c"));

    // 1. 全エンジン対象のミドルウェア
    const mwGlobal: IMiddleware<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    > = {
      priority: MiddlewarePriority.HIGH,
      onCommand: vi.fn().mockImplementation(async (c) => c),
    };
    bridge.use(mwGlobal);

    // 2. engine-a のみ対象のミドルウェア
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

    // 3. engine-a と engine-b 対象のミドルウェア
    const mwMultiAB: IMiddleware<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    > = {
      priority: MiddlewarePriority.LOW,
      supportedEngines: ["engine-a", "engine-b"],
      onCommand: vi.fn().mockImplementation(async (c) => c),
    };
    bridge.use(mwMultiAB);

    // 検証: engine-a には 3 つすべて適用される
    const engineA = bridge.getEngine("engine-a");
    await engineA.search({} as IBaseSearchOptions);
    expect(mwGlobal.onCommand).toHaveBeenCalled();
    expect(mwSpecificA.onCommand).toHaveBeenCalled();
    expect(mwMultiAB.onCommand).toHaveBeenCalled();

    vi.clearAllMocks();

    // 検証: engine-b には 2 つ適用される (all + a-and-b)
    const engineB = bridge.getEngine("engine-b");
    await engineB.search({} as IBaseSearchOptions);
    expect(mwGlobal.onCommand).toHaveBeenCalled();
    expect(mwSpecificA.onCommand).not.toHaveBeenCalled();
    expect(mwMultiAB.onCommand).toHaveBeenCalled();

    vi.clearAllMocks();

    // 検証: engine-c には 1 つのみ適用される (all)
    const engineC = bridge.getEngine("engine-c");
    await engineC.search({} as IBaseSearchOptions);
    expect(mwGlobal.onCommand).toHaveBeenCalled();
    expect(mwSpecificA.onCommand).not.toHaveBeenCalled();
    expect(mwMultiAB.onCommand).not.toHaveBeenCalled();
  });
});
