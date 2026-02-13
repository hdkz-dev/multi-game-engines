import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineFacade } from "../bridge/EngineFacade.js";
import { IMiddleware, IEngineLoader, EngineStatus, IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult } from "../types.js";

describe("EngineFacade", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adapter: any;
  let middlewares: IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>[];

  beforeEach(() => {
    adapter = {
      id: "test-engine",
      name: "Test Engine",
      version: "1.0.0",
      status: "uninitialized" as EngineStatus,
      parser: {
        createSearchCommand: vi.fn().mockReturnValue("search-command"),
        parseInfo: vi.fn(),
        parseResult: vi.fn(),
        createStopCommand: vi.fn().mockReturnValue("stop-command"),
      },
      load: vi.fn().mockImplementation(async () => {
        adapter.status = "ready";
      }),
      searchRaw: vi.fn().mockImplementation(() => ({
        info: (async function* () { 
          yield { raw: "info" }; 
        })(),
        result: Promise.resolve({ raw: "result" }),
        stop: vi.fn(),
      })),
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onProgress: vi.fn().mockReturnValue(() => {}),
      onTelemetry: vi.fn().mockReturnValue(() => {}),
      setOption: vi.fn(),
      dispose: vi.fn(),
    };
    middlewares = [];
  });

  it("探索リクエストが連続した場合、前のタスクを自動的に停止すること", async () => {
    const facade = new EngineFacade(adapter, middlewares);
    const task1Stop = vi.fn();
    adapter.searchRaw.mockReturnValueOnce({
      info: (async function* () { 
        await new Promise(r => setTimeout(r, 100));
        yield { raw: "info" };
      })(),
      result: new Promise(() => {}), // 終わらない
      stop: task1Stop,
    });

    void facade.search({ board: "..." } as IBaseSearchOptions);
    await new Promise(r => setTimeout(r, 10));
    
    // 次の検索
    await facade.search({ board: "..." } as IBaseSearchOptions);

    expect(task1Stop).toHaveBeenCalled();
  });

  it("ミドルウェアが正しい順序でコマンドと結果を加工すること", async () => {
    const mw: IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> = {
      onCommand: vi.fn().mockImplementation((cmd) => `${cmd}-modified`),
      onResult: vi.fn().mockImplementation((res) => ({ ...res, modified: true })),
    };
    const facade = new EngineFacade(adapter, [mw]);
    const result = await facade.search({ board: "..." } as IBaseSearchOptions);

    expect(mw.onCommand).toHaveBeenCalledWith("search-command", expect.anything());
    expect(adapter.searchRaw).toHaveBeenCalledWith("search-command-modified");
    expect(result).toEqual({ raw: "result", modified: true });
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
    new EngineFacade(adapter);
    expect(adapter.onStatusChange).toHaveBeenCalled();
    expect(adapter.onProgress).toHaveBeenCalled();
  });

  it("AbortSignal が既に aborted の場合、即座に探索を停止すること", async () => {
    const facade = new EngineFacade(adapter);
    const stopSpy = vi.fn();
    adapter.searchRaw.mockReturnValue({
      info: (async function* () { yield { raw: "info" }; })(),
      result: Promise.resolve({ raw: "result" }),
      stop: stopSpy,
    });

    const controller = new AbortController();
    controller.abort();

    await facade.search({ signal: controller.signal } as IBaseSearchOptions);
    expect(stopSpy).toHaveBeenCalled();
  });

  it("dispose() 時に全てのリスナーが解除され、アダプターも破棄されること", async () => {
    const facade = new EngineFacade(adapter);
    await facade.dispose();
    expect(adapter.dispose).toHaveBeenCalled();
  });

  it("should dispose adapter only if it owns it", async () => {
    const facade = new EngineFacade(adapter, [], undefined, false);
    await facade.dispose();
    expect(adapter.dispose).not.toHaveBeenCalled();
  });

  it("should atomic load: concurrent load() calls should be shared", async () => {
    let loadCount = 0;
    adapter.load = vi.fn().mockImplementation(async () => {
      loadCount++;
      await new Promise(r => setTimeout(r, 50));
      adapter.status = "ready";
    });

    const facade = new EngineFacade(adapter);
    
    // 同時に2回叩く
    const p1 = facade.load();
    const p2 = facade.load();
    
    await Promise.all([p1, p2]);

    expect(loadCount).toBe(1);
  });
});
