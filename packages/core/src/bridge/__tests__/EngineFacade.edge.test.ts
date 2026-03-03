import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import {
  IMiddleware,
  IEngineLoader,
  EngineStatus,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineErrorCode,
} from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";

describe("EngineFacade Edge Cases: Concurrency & Lifecycle", () => {
  let adapter: unknown;
  let mockLoader: IEngineLoader;

  beforeEach(() => {
    adapter = {
      id: "test-engine",
      status: "uninitialized",
      load: vi.fn().mockResolvedValue(undefined),
      setOption: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue({ raw: "result", bestMove: "e2e4" }),
      searchRaw: vi.fn().mockImplementation(() => ({
        info: (async function* () {
          yield { depth: 1 };
        })(),
        result: Promise.resolve({ raw: "result", bestMove: "e2e4" }),
        stop: vi.fn(),
      })),
      stop: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn().mockImplementation(function(this: any) {
        this.status = "disposed";
        return Promise.resolve();
      }),
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onTelemetry: vi.fn().mockReturnValue(() => {}),
      onInfo: vi.fn().mockReturnValue(() => {}),
      onSearchResult: vi.fn().mockReturnValue(() => {}),
      updateStatus: vi.fn(),
      parser: {
        createSearchCommand: vi.fn().mockReturnValue("go"),
      }
    };

    mockLoader = {
      loadResource: vi.fn(),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    } as unknown;
  });

  it("アトミック・ロード: 同時に load() を呼んでも、アダプターの load は一度しか呼ばれないこと (Race Condition)", async () => {
    adapter.load.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)));
    // facade.load() はコンストラクタで渡された loaderProvider を内部で使用する
    const facade = new EngineFacade(adapter, [], () => Promise.resolve(mockLoader));

    const p1 = facade.load();
    const p2 = facade.load();
    const p3 = facade.load();

    await Promise.all([p1, p2, p3]);
    expect(adapter.load).toHaveBeenCalledTimes(1);
  });

  it("探索中に dispose() が呼ばれた場合、探索が適切に中断されリソースが解放されること (Interruption)", async () => {
    let rejectTask: (reason?: unknown) => void;
    const taskResultPromise = new Promise((_, reject) => {
      rejectTask = reject;
    });

    adapter.searchRaw.mockImplementation(() => ({
      info: (async function* () {})(),
      result: taskResultPromise,
      stop: vi.fn().mockImplementation(() => {
        rejectTask(new EngineError({ code: EngineErrorCode.CANCELLED, message: "aborted" }));
      }),
    }));

    const facade = new EngineFacade(adapter);
    facade.loadingStrategy = "manual";
    adapter.status = "ready";

    const searchRun = facade.search({} as unknown);
    await facade.dispose();

    await expect(searchRun).rejects.toThrow(
      expect.objectContaining({ code: EngineErrorCode.CANCELLED })
    );

    expect(adapter.dispose).toHaveBeenCalled();
  });

  it("ミドルウェアが例外を投げた際の絶縁性 (Fault Tolerance)", async () => {
    const buggyMw: IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> = {
      onCommand: vi.fn().mockImplementation(() => { throw new Error("MW Crash"); })
    };
    adapter.status = "ready";
    const facade = new EngineFacade(adapter, [buggyMw]);

    const result = await facade.search({} as unknown);
    expect(result.bestMove).toBe("e2e4");
    expect(buggyMw.onCommand).toHaveBeenCalled();
  });

  it("多重 dispose() 呼び出しが安全であること (Idempotency)", async () => {
    const facade = new EngineFacade(adapter);
    await facade.dispose();
    await facade.dispose();
    
    expect(adapter.dispose).toHaveBeenCalledTimes(1);
  });
});
