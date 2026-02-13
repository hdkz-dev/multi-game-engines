import { describe, it, expect, vi } from "vitest";
import { EngineBridge } from "../bridge/EngineBridge.js";
import { 
  IEngineAdapter, 
  IBaseSearchOptions, 
  IBaseSearchInfo, 
  IBaseSearchResult,
  IProtocolParser,
  IMiddleware,
  EngineStatus
} from "../types.js";

describe("EngineBridge", () => {
  const createMockAdapter = (id: string) => ({
    id,
    name: `Mock ${id}`,
    version: "1.0.0",
    status: "ready" as EngineStatus,
    parser: {
      createSearchCommand: vi.fn(),
      createStopCommand: vi.fn(),
      createOptionCommand: vi.fn(),
    } as unknown as IProtocolParser<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>,
    load: vi.fn().mockResolvedValue(undefined),
    searchRaw: vi.fn().mockImplementation(() => ({
      info: (async function* () { yield { raw: "info depth 1 score 10" } as IBaseSearchInfo; })(),
      result: Promise.resolve({ raw: "bestmove e2e4" } as IBaseSearchResult),
      stop: vi.fn(),
    })),
    setOption: vi.fn().mockResolvedValue(undefined),
    onStatusChange: vi.fn().mockReturnValue(() => {}),
    onProgress: vi.fn().mockReturnValue(() => {}),
    onTelemetry: vi.fn().mockReturnValue(() => {}),
    dispose: vi.fn().mockResolvedValue(undefined),
  } as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

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

  it("supportedEngines に基づいてミドルウェアがフィルタリングされること", async () => {
    const bridge = new EngineBridge();
    const adapter1 = createMockAdapter("engine1");
    const adapter2 = createMockAdapter("engine2");
    await bridge.registerAdapter(adapter1);
    await bridge.registerAdapter(adapter2);

    const mwSpecific = {
      onCommand: vi.fn().mockImplementation((cmd) => cmd),
      supportedEngines: ["engine1"]
    };
    const mwGlobal = {
      onCommand: vi.fn().mockImplementation((cmd) => cmd)
    };
    const mwMulti = {
      onCommand: vi.fn().mockImplementation((cmd) => cmd),
      supportedEngines: ["engine1", "engine2"]
    };

    bridge.use(mwSpecific as unknown as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);
    bridge.use(mwGlobal as unknown as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);
    bridge.use(mwMulti as unknown as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    const engine1 = bridge.getEngine("engine1");
    const engine2 = bridge.getEngine("engine2");

    // 探索を実行してミドルウェアをトリガー
    adapter1.parser.createSearchCommand = vi.fn().mockReturnValue("go");
    adapter2.parser.createSearchCommand = vi.fn().mockReturnValue("go");

    await engine1.search({} as IBaseSearchOptions);
    await engine2.search({} as IBaseSearchOptions);

    // mwSpecific は engine1 でのみ呼ばれる
    expect(mwSpecific.onCommand).toHaveBeenCalledTimes(1);
    // mwGlobal は両方で呼ばれる
    expect(mwGlobal.onCommand).toHaveBeenCalledTimes(2);
    // mwMulti は両方で呼ばれる
    expect(mwMulti.onCommand).toHaveBeenCalledTimes(2);
  });

  it("getEngine が同じ ID に対して同じインスタンスを返すこと (Caching)", async () => {
    const bridge = new EngineBridge();
    const adapter = {
      id: "engine1",
      name: "Engine 1",
      version: "1.0.0",
      status: "ready" as EngineStatus,
      parser: {} as unknown as IProtocolParser<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>,
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onProgress: vi.fn().mockReturnValue(() => {}),
      onTelemetry: vi.fn().mockReturnValue(() => {}),
      dispose: vi.fn().mockResolvedValue(undefined),
    };
    await bridge.registerAdapter(adapter as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    const instance1 = bridge.getEngine("engine1");
    const instance2 = bridge.getEngine("engine1");

    expect(instance1).toBe(instance2);

    // ミドルウェアを追加
    bridge.use({ onCommand: (c: unknown) => c } as unknown as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    // キャッシュがクリアされ、新しいインスタンスが返されるはず
    const instance3 = bridge.getEngine("engine1");
    expect(instance3).not.toBe(instance1);
  });

  it("should purge garbage collected engine instances from count", async () => {
    const bridge = new EngineBridge();
    const adapter = {
      id: "leak-test",
      name: "Leak Test",
      version: "1.0.0",
      status: "ready" as EngineStatus,
      parser: {} as unknown as IProtocolParser<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>,
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onProgress: vi.fn().mockReturnValue(() => {}),
      onTelemetry: vi.fn().mockReturnValue(() => {}),
      dispose: vi.fn().mockResolvedValue(undefined),
    };
    await bridge.registerAdapter(adapter as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    // インスタンスを生成
    bridge.getEngine("leak-test");

    // この時点で count は 1
    expect(bridge.getActiveEngineCount()).toBe(1);

    // 注意: 実際の GC を待つ代わりに内部の WeakRef をモックして purge を検証
    // プライベートプロパティへのアクセスのため unknown キャストを使用 (テスト用)
    const engineInstances = (bridge as unknown as { 
      engineInstances: Map<string, { deref: () => unknown }> 
    }).engineInstances;
    
    const ref = engineInstances.get("leak-test");
    if (ref) {
      vi.spyOn(ref, "deref").mockReturnValue(undefined);
    }

    expect(bridge.getActiveEngineCount()).toBe(0);
    expect(engineInstances.has("leak-test")).toBe(false);
  });

  it("should filter middlewares based on supportedEngines", async () => {
    const bridge = new EngineBridge();
    
    // モックアダプターの登録
    const createMock = (id: string) => ({
      id,
      name: id,
      version: "1.0.0",
      status: "ready" as EngineStatus,
      parser: {} as unknown as IProtocolParser<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>,
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onProgress: vi.fn().mockReturnValue(() => {}),
      onTelemetry: vi.fn().mockReturnValue(() => {}),
      dispose: vi.fn().mockResolvedValue(undefined),
    });
    
    await bridge.registerAdapter(createMock("engine-a") as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);
    await bridge.registerAdapter(createMock("engine-b") as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);
    await bridge.registerAdapter(createMock("engine-c") as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    // 1. 全エンジン対象のミドルウェア
    bridge.use({
      priority: 10,
      onCommand: async (c: unknown) => c,
    } as unknown as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    // 2. engine-a のみ対象のミドルウェア
    bridge.use({
      priority: 5,
      supportedEngines: ["engine-a"],
      onCommand: async (c: unknown) => c,
    } as unknown as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    // 3. engine-a と engine-b 対象のミドルウェア
    bridge.use({
      priority: 1,
      supportedEngines: ["engine-a", "engine-b"],
      onCommand: async (c: unknown) => c,
    } as unknown as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

    // 検証: engine-a には 3 つすべて適用される
    const engineA = bridge.getEngine("engine-a");
    const mwsA = (engineA as unknown as { middlewares: IMiddleware[] }).middlewares;
    expect(mwsA.length).toBe(3);

    // 検証: engine-b には 2 つ適用される (all + a-and-b)
    const engineB = bridge.getEngine("engine-b");
    const mwsB = (engineB as unknown as { middlewares: IMiddleware[] }).middlewares;
    expect(mwsB.length).toBe(2);

    // 検証: engine-c には 1 つのみ適用される (all)
    const engineC = bridge.getEngine("engine-c");
    const mwsC = (engineC as unknown as { middlewares: IMiddleware[] }).middlewares;
    expect(mwsC.length).toBe(1);
  });
});
