import { describe, it, expect, vi } from "vitest";
import { EngineFacade } from "../bridge/EngineFacade";
import { 
  IBaseSearchOptions, 
  IBaseSearchInfo, 
  IBaseSearchResult, 
  ISearchTask, 
  FEN,
  IMiddleware,
  IEngineAdapter,
  Move
} from "../types";

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
    },
    searchRaw: vi.fn().mockImplementation(() => ({
      info: (async function* () { yield { depth: 1, score: 10 } as IBaseSearchInfo; })(),
      result: new Promise((resolve) => setTimeout(() => resolve({ bestMove: "e2e4" as Move } as IBaseSearchResult), 50)),
      stop: vi.fn().mockResolvedValue(undefined),
    })),
    load: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn().mockResolvedValue(undefined),
    onStatusChange: vi.fn().mockReturnValue(() => {}),
    onProgress: vi.fn().mockReturnValue(() => {}),
    onTelemetry: vi.fn().mockReturnValue(() => {}),
  } as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

  it("探索リクエストが連続した場合、前のタスクを自動的に停止すること", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    const options: IBaseSearchOptions = { fen: "startpos" as FEN };

    // 1回目の探索を開始
    const search1 = facade.search(options);
    
    // searchRaw が呼ばれるまで少し待機
    await vi.waitFor(() => expect(adapter.searchRaw).toHaveBeenCalled());
    
    const task1 = (vi.mocked(adapter.searchRaw).mock.results[0].value as ISearchTask<IBaseSearchInfo, IBaseSearchResult>);
    const stopSpy = vi.mocked(task1.stop);

    // 2回目の探索を実行。これにより 1 回目が停止されるはず。
    await facade.search(options);

    expect(stopSpy).toHaveBeenCalled();
    await search1; 
  });

  it("ミドルウェアが正しい順序でコマンドと結果を加工すること", async () => {
    const adapter = createMockAdapter();
    const middleware: IMiddleware<IBaseSearchInfo, IBaseSearchResult> = {
      onCommand: async (cmd) => `${cmd}_modified`,
      onResult: async (res) => ({ ...res, bestMove: `${res.bestMove}_modified` as Move }),
    };

    const facade = new EngineFacade(adapter, [middleware]);
    const options: IBaseSearchOptions = { fen: "startpos" as FEN };

    const result = await facade.search(options);

    expect(adapter.searchRaw).toHaveBeenCalledWith("go_modified");
    expect(result.bestMove).toBe("e2e4_modified");
  });

  it("onInfo が検索を跨いで継続的に動作すること (Persistent Listener)", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    const infoSpy = vi.fn();

    // 購読を開始
    facade.onInfo(infoSpy);

    // 1回目の探索
    await facade.search({ fen: "pos1" as FEN });
    
    // 2回目の探索
    await facade.search({ fen: "pos2" as FEN });

    // 両方の探索から info が届いているはず (mock では各1回)
    expect(infoSpy).toHaveBeenCalledTimes(2);
  });

  it("load() がアダプターの load を呼び出すこと", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, []);
    await facade.load();
    expect(adapter.load).toHaveBeenCalled();
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
      fen: "startpos" as FEN,
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
});
