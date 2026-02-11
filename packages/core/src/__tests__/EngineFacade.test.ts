import { describe, it, expect, vi } from "vitest";
import { EngineFacade } from "../bridge/EngineFacade";
import { EngineBridge } from "../bridge/EngineBridge";
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
 * 2026年のベストプラクティスに基づき、型安全かつ非同期の競合をシミュレートします。
 */
describe("EngineFacade", () => {
  /**
   * モックアダプターの構築。
   * インターフェースを部分的に実装し、不足分をキャストすることで any を最小限に抑えます。
   */
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
      result: new Promise((resolve) => setTimeout(() => resolve({ bestMove: "e2e4" as Move } as IBaseSearchResult), 10)),
      stop: vi.fn().mockResolvedValue(undefined),
    })),
    load: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn().mockResolvedValue(undefined),
    onStatusChange: vi.fn().mockReturnValue(() => {}),
    onProgress: vi.fn().mockReturnValue(() => {}),
  } as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

  /** 
   * ブリッジのモック。
   * 具象クラスを継承せずにインターフェースを満たすように構成。
   */
  const mockBridge = {
    getLoader: vi.fn().mockResolvedValue({}),
  } as unknown as EngineBridge;

  it("探索リクエストが連続した場合、前のタスクを自動的に停止すること", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, [], mockBridge);
    const options: IBaseSearchOptions = { fen: "startpos" as FEN };

    // 1回目の探索を開始
    const search1 = facade.search(options);
    
    // アダプターが返したタスクの stop スパイを取得。
    // searchRaw が返したオブジェクトの参照を mock.results から特定する。
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

    const facade = new EngineFacade(adapter, [middleware], mockBridge);
    const options: IBaseSearchOptions = { fen: "startpos" as FEN };

    const result = await facade.search(options);

    expect(adapter.searchRaw).toHaveBeenCalledWith("go_modified");
    expect(result.bestMove).toBe("e2e4_modified");
  });

  it("既に中断されている AbortSignal が渡された場合、即座にエラーを投げること", async () => {
    const adapter = createMockAdapter();
    const facade = new EngineFacade(adapter, [], mockBridge);
    const controller = new AbortController();
    controller.abort(); // 事前中断

    const options: IBaseSearchOptions = { fen: "startpos" as FEN, signal: controller.signal };

    // 探索メソッドがアダプターを呼ぶ前にエラーを投げることを検証
    await expect(facade.search(options)).rejects.toThrow(/aborted/i);
    expect(adapter.searchRaw).not.toHaveBeenCalled();
  });
});
