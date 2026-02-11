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
  IEngineBridge,
  Move
} from "../types";

/**
 * EngineFacade の結合テスト。
 * ミドルウェアのパイプライン処理と、タスクの排他制御（Concurrency Control）を検証します。
 */
describe("EngineFacade", () => {
  // モックアダプターの構築
  const mockAdapter = {
    id: "test-engine",
    parser: {
      createSearchCommand: vi.fn().mockReturnValue("go"),
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
  } as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>;

  // Bridge のモック
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockBridge = {
    getLoader: vi.fn(),
  } as unknown as IEngineBridge;

  it("探索リクエストが連続した場合、前のタスクを自動的に停止すること", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const facade = new EngineFacade(mockAdapter, [], mockBridge as any);
    const options: IBaseSearchOptions = { fen: "startpos" as FEN };

    // 1回目の探索
    const search1 = facade.search(options);
    
    // アダプターが返したタスクの stop スパイを取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const task1 = (mockAdapter.searchRaw as any).mock.results[0].value as ISearchTask<any, any>;
    const stopSpy = task1.stop;

    // 2回目の探索（これにより1回目が停止される）
    await facade.search(options);

    expect(stopSpy).toHaveBeenCalled();
    await search1; 
  });

  it("ミドルウェアが正しい順序でコマンドと結果を加工すること", async () => {
    const middleware: IMiddleware<IBaseSearchInfo, IBaseSearchResult> = {
      onCommand: async (cmd) => `${cmd}_modified`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onResult: async (res) => ({ ...res, bestMove: `${res.bestMove}_modified` as any }),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const facade = new EngineFacade(mockAdapter, [middleware], mockBridge as any);
    const options: IBaseSearchOptions = { fen: "startpos" as FEN };

    const result = await facade.search(options);

    expect(mockAdapter.searchRaw).toHaveBeenCalledWith("go_modified");
    expect(result.bestMove).toBe("e2e4_modified");
  });

  it("AbortSignal が中断されている場合、即座にエラーを投げること", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const facade = new EngineFacade(mockAdapter, [], mockBridge as any);
    const controller = new AbortController();
    controller.abort();

    const options: IBaseSearchOptions = { fen: "startpos" as FEN, signal: controller.signal };

    await expect(facade.search(options)).rejects.toThrow(/aborted/i);
  });
});
