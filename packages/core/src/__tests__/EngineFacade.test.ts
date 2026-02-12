import { describe, it, expect, vi } from "vitest";
import { EngineFacade } from "../bridge/EngineFacade";
import { 
  IBaseSearchOptions, 
  IBaseSearchInfo, 
  IBaseSearchResult, 
  ISearchTask, 
  IMiddleware,
  IEngineAdapter
} from "../types.js";

interface IMockResult extends IBaseSearchResult {
  move: string;
}

/**
 * EngineFacade の結合テスト。
 */
describe("EngineFacade", () => {
  const createMockAdapter = () => ({
    id: "test-engine",
    name: "Mock Engine",
    version: "1.0.0",
    status: "ready",
    parser: {
      createSearchCommand: vi.fn().mockReturnValue("go"),
      createStopCommand: vi.fn().mockReturnValue("stop"),
      createOptionCommand: vi.fn().mockReturnValue("setoption"),
    },
    searchRaw: vi.fn().mockImplementation(() => ({
      info: (async function* () { yield { raw: "info depth 1" } as IBaseSearchInfo; })(),
      result: new Promise((resolve) => setTimeout(() => resolve({ move: "e2e4", raw: "bestmove e2e4" } as IMockResult), 50)),
      stop: vi.fn().mockResolvedValue(undefined),
    })),
    load: vi.fn().mockResolvedValue(undefined),
    setOption: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn().mockResolvedValue(undefined),
    onStatusChange: vi.fn().mockReturnValue(() => {}),
    onProgress: vi.fn().mockReturnValue(() => {}),
    onTelemetry: vi.fn().mockReturnValue(() => {}),
  } as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IMockResult>);

  it("探索リクエストが連続した場合、前のタスクを自動的に停止すること", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    const options: IBaseSearchOptions = {};

    // 1回目の探索を開始
    const search1 = facade.search(options);
    
    // searchRaw が呼ばれるまで少し待機
    await vi.waitFor(() => expect(adapter.searchRaw).toHaveBeenCalled());
    
    const task1 = (vi.mocked(adapter.searchRaw).mock.results[0].value as ISearchTask<IBaseSearchInfo, IMockResult>);
    const stopSpy = vi.mocked(task1.stop);

    // 2回目の探索を実行。これにより 1 回目が停止されるはず。
    await facade.search(options);

    expect(stopSpy).toHaveBeenCalled();
    await search1; 
  });

  it("ミドルウェアが正しい順序でコマンドと結果を加工すること", async () => {
    const adapter = createMockAdapter();
    const middleware: IMiddleware<IBaseSearchInfo, IMockResult> = {
      onCommand: async (cmd) => `${cmd}_modified`,
      onResult: async (res) => ({ ...res, move: `${res.move}_modified` }),
    };

    const facade = new EngineFacade(adapter, [middleware]);
    const options: IBaseSearchOptions = {};

    const result = await facade.search(options);

    expect(adapter.searchRaw).toHaveBeenCalledWith("go_modified");
    expect(result.move).toBe("e2e4_modified");
  });

  it("onInfo が検索を跨いで継続的に動作すること (Persistent Listener)", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    const infoSpy = vi.fn();

    // 購読を開始
    facade.onInfo(infoSpy);

    // 1回目の探索
    await facade.search({});
    
    // 2回目の探索
    await facade.search({});

    // 両方の探索から info が届いているはず (mock では各1回)
    expect(infoSpy).toHaveBeenCalledTimes(2);
  });

  it("load() がプロバイダーから取得したローダーをアダプターの load に渡すこと", async () => {
    const adapter = createMockAdapter();
    const mockLoader = { loadResource: vi.fn() };
    const loaderProvider = vi.fn().mockResolvedValue(mockLoader);
    
    const facade = new EngineFacade(adapter, [], loaderProvider);
    await facade.load();
    
    expect(loaderProvider).toHaveBeenCalled();
    expect(adapter.load).toHaveBeenCalledWith(mockLoader);
  });

  it("各イベントの購読がアダプターに委譲されること", () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    
    const spy = vi.fn();
    facade.onStatusChange(spy);
    facade.onProgress(spy);
    facade.onTelemetry(spy);

    expect(adapter.onStatusChange).toHaveBeenCalled();
    expect(adapter.onProgress).toHaveBeenCalled();
    // onTelemetry はオプショナル
    expect(adapter.onTelemetry).toHaveBeenCalled();
  });

  it("AbortSignal が既に aborted の場合、即座に探索を停止すること", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    
    const controller = new AbortController();
    controller.abort("already aborted");

    await facade.search({ 
      signal: controller.signal 
    });

    // searchRaw は一度呼ばれるが、その直後に task.stop が呼ばれるはず
    expect(adapter.searchRaw).toHaveBeenCalled();
    const task = (vi.mocked(adapter.searchRaw).mock.results[0].value as ISearchTask<IBaseSearchInfo, IBaseSearchResult>);
    expect(task.stop).toHaveBeenCalled();
  });

  it("dispose() 時に全てのリスナーが解除され、アダプターも破棄されること", async () => {
    const unsubSpy = vi.fn();
    const adapter = createMockAdapter();
    vi.mocked(adapter.onStatusChange).mockReturnValue(unsubSpy);
    
    const facade = new EngineFacade(adapter, []);
    
    // イベント購読
    facade.onStatusChange(vi.fn());
    
    // Facade を破棄
    await facade.dispose();

    // アダプターの dispose が呼ばれ、且つ Facade 内部で管理されていた unsub が呼ばれるべき
    expect(adapter.dispose).toHaveBeenCalled();
    expect(unsubSpy).toHaveBeenCalled();
  });

  it("should dispose adapter only if it owns it", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, [], undefined, false);
    await facade.dispose();
    expect(adapter.dispose).not.toHaveBeenCalled();
    
    const owningFacade = new EngineFacade(adapter, [], undefined, true);
    await owningFacade.dispose();
    expect(adapter.dispose).toHaveBeenCalled();
  });

  it("should atomic load: concurrent load() calls should be shared", async () => {
    const adapter = createMockAdapter();
    // load に時間がかかるように調整
    let loadCount = 0;
    adapter.load = vi.fn().mockImplementation(async () => {
      loadCount++;
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const facade = new EngineFacade(adapter, []);
    
    // 同時に3回 load を呼び出す
    const p1 = facade.load();
    const p2 = facade.load();
    const p3 = facade.load();

    await Promise.all([p1, p2, p3]);

    // 内部的な adapter.load は1回だけ呼ばれているはず
    expect(loadCount).toBe(1);
  });
});
