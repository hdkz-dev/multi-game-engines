import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineBatchAnalyzer } from "../EngineBatchAnalyzer.js";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  IBaseSearchInfo,
  EngineErrorCode,
} from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";

describe("EngineBatchAnalyzer", () => {
  let mockEngine: {
    search: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };
  let analyzer: EngineBatchAnalyzer<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;

  beforeEach(() => {
    mockEngine = {
      search: vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve({ bestMove: "e2e4" } as IBaseSearchResult),
        ),
      stop: vi.fn(),
    };
    analyzer = new EngineBatchAnalyzer(
      mockEngine as any as IEngine<
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    );
  });

  it("should analyze multiple positions sequentially", async () => {
    analyzer.add({ fen: "pos1" } as IBaseSearchOptions);
    analyzer.add({ fen: "pos2" } as IBaseSearchOptions);

    const onProgress = vi.fn();
    const results = await analyzer.analyzeAll(onProgress);

    expect(results).toHaveLength(2);
    expect(mockEngine.search).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith(2, 2, expect.anything());
  });

  it("should handle pause and resume", async () => {
    analyzer.add({ fen: "pos1" } as IBaseSearchOptions);
    analyzer.add({ fen: "pos2" } as IBaseSearchOptions);

    analyzer.pause();
    const runPromise = analyzer.analyzeAll();

    // Give it a bit of time to check if it proceeds
    await new Promise((r) => setTimeout(r, 100));
    expect(mockEngine.search).not.toHaveBeenCalled();

    analyzer.resume();
    const results = await runPromise;
    expect(results).toHaveLength(2);
    expect(mockEngine.search).toHaveBeenCalledTimes(2);
  });

  it("should handle abort", async () => {
    analyzer.add({ fen: "pos1" } as IBaseSearchOptions);
    analyzer.add({ fen: "pos2" } as IBaseSearchOptions);

    mockEngine.search.mockImplementationOnce(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return { bestMove: "e2e4" } as IBaseSearchResult;
    });

    const runPromise = analyzer.analyzeAll();
    analyzer.abort();

    const results = await runPromise;
    // abort() stops further items, but current one might finish or be cancelled
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("should allow prioritized interruption", async () => {
    analyzer.add({ fen: "pos1" } as IBaseSearchOptions);
    analyzer.add({ fen: "pos2" } as IBaseSearchOptions);

    // Start background analysis
    const allPromise = analyzer.analyzeAll();

    // Interrupt with high priority search
    const priorityResult = await analyzer.analyzePriority({
      fen: "priority",
    } as IBaseSearchOptions);

    expect(priorityResult.bestMove).toBe("e2e4");
    expect(mockEngine.stop).toHaveBeenCalled(); // Should stop current background task

    await allPromise;
  });

  it("should stop processing on abort during search", async () => {
    analyzer.add({ fen: "p1" } as any);
    analyzer.add({ fen: "p2" } as any);

    mockEngine.search.mockImplementationOnce(async () => {
      analyzer.abort();
      throw new EngineError({
        code: EngineErrorCode.CANCELLED,
        message: "Aborted",
      });
    });

    const results = await analyzer.analyzeAll();
    expect(results).toHaveLength(0);
    expect(mockEngine.search).toHaveBeenCalledTimes(1);
  });

  it("should report progress", () => {
    analyzer.add({} as any);
    analyzer.add({} as any);
    expect(analyzer.progress).toEqual({ current: 0, total: 2 });
  });

  it("should throw error if search fails with non-cancellation error", async () => {
    analyzer.add({ fen: "pos1" } as IBaseSearchOptions);
    mockEngine.search.mockRejectedValue(new Error("Fatal error"));

    await expect(analyzer.analyzeAll()).rejects.toThrow("Fatal error");
  });

  it("should continue to next item if search is cancelled but not aborted (e.g. pause simulation)", async () => {
    analyzer.add({ fen: "p1" } as IBaseSearchOptions);
    analyzer.add({ fen: "p2" } as IBaseSearchOptions);

    mockEngine.search
      .mockRejectedValueOnce(
        new EngineError({ code: EngineErrorCode.CANCELLED, message: "Paused" }),
      )
      .mockResolvedValueOnce({ bestMove: "e7e5" } as IBaseSearchResult);

    const results = await analyzer.analyzeAll();
    // It should have retried the same item and succeeded
    expect(results[0]?.bestMove).toBe("e7e5");
  });
});
