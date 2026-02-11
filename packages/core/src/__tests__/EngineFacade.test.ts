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
  IEngineBridge,
  Move
} from "../types";

/**
 * EngineFacade の結合テスト。
 * 
 * [テストの意図]
 * 1. ミドルウェアの適用順序が正しいか。
 * 2. 連続した探索リクエストにおいて、先行するタスクが自動停止（排他制御）されるか。
 * 3. AbortSignal による中断が正しく Promise の拒否（reject）に繋がるか。
 */
describe("EngineFacade", () => {
  // アダプターのモック
  // インターフェースを明示的に指定し、必要最小限のキャストで構成
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

  // ブリッジのモック。Facade が内部で getLoader() を呼ぶため定義。
  const mockBridge = {
    getLoader: vi.fn(),
  } as unknown as IEngineBridge;

  it("探索リクエストが連続した場合、前のタスクを自動的に停止すること", async () => {
    // 依存関係を注入して Facade を初期化
    const facade = new EngineFacade(mockAdapter, [], mockBridge as EngineBridge);
    const options: IBaseSearchOptions = { fen: "startpos" as FEN };

    // 1回目の探索を開始（完了を待たない）
    const search1 = facade.search(options);
    
    // 内部で生成されたタスクの stop スパイを取得
    // searchRaw の戻り値を検証するために vitest のモック機能を活用
    const task1 = vi.mocked(mockAdapter.searchRaw).mock.results[0].value as ISearchTask<IBaseSearchInfo, IBaseSearchResult>;
    const stopSpy = task1.stop;

    // 2回目の探索を実行。これにより 1 回目が停止されるはず。
    await facade.search(options);

    // 検証: 1回目の stop が呼ばれ、最終的に両方の Promise が解決/拒否されること
    expect(stopSpy).toHaveBeenCalled();
    await search1; 
  });

  it("ミドルウェアが正しい順序でコマンドと結果を加工すること", async () => {
    // コマンドと結果を加工するテスト用ミドルウェア
    const middleware: IMiddleware<IBaseSearchInfo, IBaseSearchResult> = {
      onCommand: async (cmd) => `${cmd}_modified`,
      onResult: async (res) => ({ ...res, bestMove: `${res.bestMove}_modified` as Move }),
    };

    const facade = new EngineFacade(mockAdapter, [middleware], mockBridge as EngineBridge);
    const options: IBaseSearchOptions = { fen: "startpos" as FEN };

    const result = await facade.search(options);

    // 検証: アダプターには加工後のコマンドが渡り、戻り値も加工されていること
    expect(mockAdapter.searchRaw).toHaveBeenCalledWith("go_modified");
    expect(result.bestMove).toBe("e2e4_modified");
  });

  it("AbortSignal が中断されている場合、即座にエラーを投げること", async () => {
    const facade = new EngineFacade(mockAdapter, [], mockBridge as EngineBridge);
    const controller = new AbortController();
    controller.abort(); // 即時中断

    const options: IBaseSearchOptions = { fen: "startpos" as FEN, signal: controller.signal };

    // 検証: Promise が拒否され、エラーメッセージに 'aborted' が含まれること
    await expect(facade.search(options)).rejects.toThrow(/aborted/i);
  });
});
