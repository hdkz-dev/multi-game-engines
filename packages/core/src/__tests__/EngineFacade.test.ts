import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { EngineFacade } from "../bridge/EngineFacade.js";
import {
  IMiddleware,
  IEngineLoader,
  EngineStatus,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IEngineAdapter,
  IProtocolParser,
} from "../types.js";
import { createPositionString } from "../protocol/ProtocolValidator.js";

describe("EngineFacade", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  let adapter: IEngineAdapter<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  > & {
    searchRaw: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
  };
  let middlewares: IMiddleware<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >[];

  beforeEach(() => {
    // 2026 Best Practice: 用途に応じた正確なモック定義（any を使用しない）
    const mockAdapter = {
      id: "test-engine",
      name: "Test Engine",
      version: "1.0.0",
      status: "uninitialized" as EngineStatus,
      infoListeners: new Set<(info: IBaseSearchInfo) => void>(),
      parser: {
        createSearchCommand: vi.fn().mockReturnValue("search-command"),
        parseInfo: vi.fn(),
        parseResult: vi.fn(),
        createStopCommand: vi.fn().mockReturnValue("stop-command"),
        createOptionCommand: vi.fn(),
      } as unknown as IProtocolParser,
      load: vi.fn().mockImplementation(async () => {
        mockAdapter.status = "ready";
      }),
      searchRaw: vi.fn().mockImplementation(() => {
        // searchRaw が呼ばれたら登録済みリスナーに通知
        mockAdapter.infoListeners.forEach((l) => l({ raw: "info" }));
        return {
          info: (async function* () {
            yield { raw: "info" };
          })(),
          result: Promise.resolve({ raw: "result", bestMove: "e2e4" }),
          stop: vi.fn(),
        };
      }),
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onInfo: vi.fn((cb) => {
        mockAdapter.infoListeners.add(cb);
        return () => mockAdapter.infoListeners.delete(cb);
      }),
      onProgress: vi.fn().mockReturnValue(() => {}),
      onTelemetry: vi.fn().mockReturnValue(() => {}),
      onSearchResult: vi.fn().mockReturnValue(() => {}),
      setOption: vi.fn(),
      dispose: vi.fn(),
    };
    adapter = mockAdapter as unknown as IEngineAdapter<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    > & {
      searchRaw: ReturnType<typeof vi.fn>;
      load: ReturnType<typeof vi.fn>;
    };
    middlewares = [];
  });

  it("探索リクエストが連続した場合、前のタスクを自動的に停止すること", async () => {
    const facade = new EngineFacade(adapter, middlewares);
    const task1Stop = vi.fn();
    adapter.searchRaw.mockReturnValueOnce({
      info: (async function* () {
        await new Promise((r) => setTimeout(r, 100));
        yield { raw: "info" };
      })(),
      result: new Promise(() => {}), // 終わらない
      stop: task1Stop,
    });

    void facade.search({
      fen: createPositionString(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ),
    });
    await new Promise((r) => setTimeout(r, 10));

    // 次の検索
    await facade.search({
      fen: createPositionString("8/8/8/8/8/8/8/8 w - - 0 1"),
    });

    expect(task1Stop).toHaveBeenCalled();
  });

  it("ミドルウェアが正しい順序でコマンドと結果を加工すること", async () => {
    const mw: IMiddleware<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    > = {
      onCommand: vi.fn().mockImplementation((cmd) => `${cmd}-modified`),
      onResult: vi
        .fn()
        .mockImplementation((res) => ({ ...res, modified: true })),
    };
    const facade = new EngineFacade(adapter, [mw]);
    const result = await facade.search({
      fen: createPositionString(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ),
    });

    expect(mw.onCommand).toHaveBeenCalledWith(
      "search-command",
      expect.anything(),
    );
    expect(adapter.searchRaw).toHaveBeenCalledWith("search-command-modified");
    expect(result).toEqual({ raw: "result", bestMove: "e2e4", modified: true });
  });

  it("onInfo が検索を跨いで継続的に動作すること (Persistent Listener)", async () => {
    const facade = new EngineFacade(adapter);
    const infoSpy = vi.fn();
    facade.onInfo(infoSpy);

    // 1回目の検索
    await facade.search({ board: "..." } as IBaseSearchOptions);
    expect(infoSpy).toHaveBeenCalledTimes(1);

    // 2回目の検索
    await facade.search({ board: "..." } as IBaseSearchOptions);
    expect(infoSpy).toHaveBeenCalledTimes(2);
  });

  it("load() がプロバイダーから取得したローダーをアダプターの load に渡すこと", async () => {
    const mockLoader = {} as IEngineLoader;
    const loaderProvider = vi.fn().mockResolvedValue(mockLoader);
    const facade = new EngineFacade(adapter, [], loaderProvider);

    await facade.load();

    expect(loaderProvider).toHaveBeenCalled();
    expect(adapter.load).toHaveBeenCalledWith(mockLoader);
  });

  it("各イベントの購読がアダプターに委譲されること", () => {
    const facade = new EngineFacade(adapter);
    facade.onStatusChange(() => {});
    // facade.onProgress は IEngine には無い (IEngineAdapter にはある) が、
    // ここでは adapter への委譲を確認したい。IEngine に onProgress がないなら
    // テスト対象外とするか、実装を確認する。
    // 現状 IEngine に onProgress はないので削除し、onTelemetry を確認
    facade.onTelemetry(() => {});
    expect(adapter.onStatusChange).toHaveBeenCalled();
    expect(adapter.onTelemetry).toHaveBeenCalled();
  });

  it("should atomic load: concurrent load() calls should be shared", async () => {
    let loadCount = 0;
    // 初期状態は uninitialized
    (adapter as unknown as { status: EngineStatus }).status = "uninitialized";

    adapter.load = vi.fn().mockImplementation(async () => {
      loadCount++;
      await new Promise((r) => setTimeout(r, 50));
      (adapter as unknown as { status: EngineStatus }).status = "ready";
    });

    const facade = new EngineFacade(adapter);

    // 同時に2回叩く
    const p1 = facade.load();
    const p2 = facade.load();

    await Promise.all([p1, p2]);

    expect(loadCount).toBe(1);
  });

  it("dispose() がアダプターを破棄し、リソースを解放すること", async () => {
    const mockLoader = {
      revokeByEngineId: vi.fn(),
    } as unknown as IEngineLoader;
    const loaderProvider = vi.fn().mockResolvedValue(mockLoader);
    const facade = new EngineFacade(adapter, [], loaderProvider);

    await facade.dispose();

    expect(adapter.dispose).toHaveBeenCalled();
    expect(loaderProvider).toHaveBeenCalled();
    expect(mockLoader.revokeByEngineId).toHaveBeenCalledWith(adapter.id);
  });

  it("dispose() が loaderProvider() の例外を握りつぶすこと", async () => {
    const loaderProvider = vi
      .fn()
      .mockRejectedValue(new Error("loader unavailable"));
    const facade = new EngineFacade(adapter, [], loaderProvider);

    // 例外がスローされないこと
    await expect(facade.dispose()).resolves.toBeUndefined();
    expect(adapter.dispose).toHaveBeenCalled();
    expect(loaderProvider).toHaveBeenCalled();
  });
});
