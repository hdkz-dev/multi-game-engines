import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import { MockAdapter } from "../../mocks/MockAdapter.js";
import { createMove } from "../../protocol/ProtocolValidator.js";
import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineErrorCode,
  IMiddleware,
  ISearchTask,
} from "../../types.js";

/**
 * Covers the three remaining dispose-during-search race paths in EngineFacade:
 *   - line 265: disposed flips true while middleware loop runs → CANCELLED before searchRaw
 *   - line 278: disposed flips true between adapter.searchRaw().result resolving and onResult middlewares
 *   - line 338: dispose() runs while currentSearchTask is in-flight → adapter.stop() invoked
 */
describe("EngineFacade: dispose race coverage", () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ id: "race-cov-engine" });
    adapter.setCommunicator({
      postMessage: vi.fn(),
      onMessage: vi.fn(),
      terminate: vi.fn(),
    });
    adapter.setStatus("ready");
  });

  function makeControllableTask(): {
    task: ISearchTask<IBaseSearchInfo, IBaseSearchResult>;
    resolveResult: (r: IBaseSearchResult) => void;
    rejectResult: (e: unknown) => void;
  } {
    let resolveResult!: (r: IBaseSearchResult) => void;
    let rejectResult!: (e: unknown) => void;
    const resultPromise = new Promise<IBaseSearchResult>((res, rej) => {
      resolveResult = res;
      rejectResult = rej;
    });
    const task: ISearchTask<IBaseSearchInfo, IBaseSearchResult> = {
      info: {
        [Symbol.asyncIterator]: async function* () {
          /* no info */
        },
      },
      result: resultPromise,
      stop: () => {},
    };
    return { task, resolveResult, rejectResult };
  }

  it("throws CANCELLED if dispose() lands while a middleware is still running (line 265)", async () => {
    let releaseMw!: () => void;
    const mwGate = new Promise<void>((res) => {
      releaseMw = res;
    });
    const gatingMiddleware: IMiddleware<
      IBaseSearchOptions,
      unknown,
      IBaseSearchResult
    > = {
      id: "gate",
      onCommand: async () => {
        await mwGate;
      },
    };

    const facade = new EngineFacade(adapter, [gatingMiddleware]);
    const searchPromise = facade.search({} as IBaseSearchOptions);

    // Let the search reach the middleware loop and suspend on the gate.
    await new Promise((r) => setTimeout(r, 10));

    // dispose() sets `this.disposed = true` synchronously before its first await.
    const disposePromise = facade.dispose();
    // Release the middleware so the loop completes and the post-loop guard fires.
    releaseMw();

    await expect(searchPromise).rejects.toThrow(
      expect.objectContaining({ code: EngineErrorCode.CANCELLED }),
    );
    await disposePromise;
  });

  it("throws CANCELLED if dispose() lands between searchRaw().result and onResult middlewares (line 278)", async () => {
    const { task, resolveResult } = makeControllableTask();
    vi.spyOn(adapter, "searchRaw").mockReturnValue(task);

    const facade = new EngineFacade(adapter);
    const searchPromise = facade.search({} as IBaseSearchOptions);

    // Wait until search() has called adapter.searchRaw and is awaiting task.result.
    await new Promise((r) => setTimeout(r, 10));

    // Mark disposed=true (sync) BEFORE the result resolves. When the result
    // resolves, the post-await guard at line 277 will see disposed=true and throw.
    const disposePromise = facade.dispose();
    resolveResult({ bestMove: createMove("e2e4"), raw: "bestmove e2e4" });

    await expect(searchPromise).rejects.toThrow(
      expect.objectContaining({ code: EngineErrorCode.CANCELLED }),
    );
    await disposePromise;
  });

  it("dispose() calls adapter.stop() when an in-flight search is still pending (line 338)", async () => {
    const { task, rejectResult } = makeControllableTask();
    vi.spyOn(adapter, "searchRaw").mockReturnValue(task);
    const adapterStopSpy = vi.spyOn(adapter, "stop");

    const facade = new EngineFacade(adapter);
    const searchPromise = facade.search({} as IBaseSearchOptions);

    // Wait until currentSearchTask has been assigned inside EngineFacade.
    await new Promise((r) => setTimeout(r, 10));

    await facade.dispose();
    // The dispose() body must have hit the `if (this.currentSearchTask)` branch.
    expect(adapterStopSpy).toHaveBeenCalled();

    // Clean up the still-pending search promise.
    rejectResult(new Error("disposed"));
    await expect(searchPromise).rejects.toBeDefined();
  });
});
