import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import {
  IMiddleware,
  IEngineLoader,
  EngineErrorCode,
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";
import { createMove } from "../../protocol/ProtocolValidator.js";

describe("EngineFacade Edge Cases: Concurrency & Lifecycle", () => {
  let adapter: IEngineAdapter<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;
  let mockLoader: IEngineLoader;

  beforeEach(() => {
    adapter = {
      id: "test-engine",
      status: "uninitialized",
      load: vi.fn().mockResolvedValue(undefined),
      setOption: vi.fn().mockResolvedValue(undefined),
      search: vi
        .fn()
        .mockResolvedValue({ raw: "result", bestMove: createMove("e2e4") }),
      searchRaw: vi.fn().mockImplementation(() => ({
        info: (async function* () {
          yield { depth: 1 } as IBaseSearchInfo;
        })(),
        result: Promise.resolve({
          raw: "result",
          bestMove: createMove("e2e4"),
        } as IBaseSearchResult),
        stop: vi.fn(),
      })),
      stop: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn().mockImplementation(function (this: { status: string }) {
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
        parseInfo: vi.fn(),
        parseResult: vi.fn(),
        isReadyCommand: "isready",
        readyResponse: "readyok",
      },
    } as unknown as IEngineAdapter<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    mockLoader = {
      loadResource: vi.fn(),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    } as unknown as IEngineLoader;
  });

  it("アトミック・ロード: 同時に load() を呼んでも、アダプターの load は一度しか呼ばれないこと (Race Condition)", async () => {
    type MockLoad = { mockImplementation: (fn: () => Promise<void>) => void };
    (adapter.load as unknown as MockLoad).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 50)),
    );

    const facade = new EngineFacade(adapter, [], () =>
      Promise.resolve(mockLoader),
    );

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

    type MockSearchRaw = { mockImplementation: (fn: () => unknown) => void };
    (adapter.searchRaw as unknown as MockSearchRaw).mockImplementation(() => ({
      info: (async function* () {})(),
      result: taskResultPromise,
      stop: vi.fn().mockImplementation(() => {
        rejectTask!(
          new EngineError({
            code: EngineErrorCode.CANCELLED,
            message: "aborted",
          }),
        );
      }),
    }));

    const facade = new EngineFacade(adapter);
    facade.loadingStrategy = "manual";
    (adapter as unknown as { status: string }).status = "ready";

    const searchRun = facade.search({} as IBaseSearchOptions);
    await facade.dispose();

    await expect(searchRun).rejects.toThrow(
      expect.objectContaining({ code: EngineErrorCode.CANCELLED }),
    );

    expect(adapter.dispose).toHaveBeenCalled();
  });

  it("ミドルウェアが例外を投げた際の絶縁性 (Fault Tolerance)", async () => {
    const buggyMw: IMiddleware<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    > = {
      onCommand: vi.fn().mockImplementation(() => {
        throw new Error("MW Crash");
      }),
    };
    (adapter as unknown as { status: string }).status = "ready";
    const facade = new EngineFacade(adapter, [buggyMw]);

    const result = await facade.search({} as IBaseSearchOptions);
    expect(result.bestMove).toBe(createMove("e2e4"));
    expect(buggyMw.onCommand).toHaveBeenCalled();
  });

  it("多重 dispose() 呼び出しが安全であること (Idempotency)", async () => {
    const facade = new EngineFacade(adapter);
    await facade.dispose();
    await facade.dispose();

    expect(adapter.dispose).toHaveBeenCalledTimes(1);
  });
});
