import { describe, it, expect, vi } from "vitest";
import { EnsembleAdapter } from "../EnsembleAdapter.js";
import { MajorityVoteStrategy } from "../strategies/MajorityVoteStrategy.js";
import {
  IEngine,
  IBaseSearchResult,
  createPositionString,
  EngineTelemetry,
  IMiddleware,
} from "@multi-game-engines/core";

describe("EnsembleAdapter", () => {
  const mockEngine = (id: string, move: string): IEngine =>
    ({
      id,
      name: id,
      version: "1.0",
      status: "ready",
      lastError: null,
      load: vi.fn().mockResolvedValue(undefined),
      search: vi
        .fn()
        .mockResolvedValue({ bestMove: move } as IBaseSearchResult),
      stop: vi.fn(),
      dispose: vi.fn().mockResolvedValue(undefined),
      consent: vi.fn(),
      setBook: vi.fn().mockResolvedValue(undefined),
      onInfo: vi.fn().mockReturnValue(() => {}),
      onSearchResult: vi.fn().mockReturnValue(() => {}),
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      onTelemetry: vi.fn().mockReturnValue(() => {}),
      emitTelemetry: vi.fn(),
      use: vi.fn().mockReturnThis(),
      unuse: vi.fn().mockReturnThis(),
    }) as unknown as IEngine;

  it("should aggregate results using majority vote", async () => {
    const e1 = mockEngine("e1", "e2e4");
    const e2 = mockEngine("e2", "d2d4");
    const e3 = mockEngine("e3", "e2e4");

    const strategy = new MajorityVoteStrategy();
    const ensemble = new EnsembleAdapter(
      "ensemble",
      "Ensemble",
      "1.0",
      [e1, e2, e3],
      strategy,
    );

    await ensemble.load();
    const result = await ensemble.search({
      fen: createPositionString("startpos"),
    });

    expect(result.bestMove).toBe("e2e4");
    expect(e1.search).toHaveBeenCalled();
    expect(e2.search).toHaveBeenCalled();
    expect(e3.search).toHaveBeenCalled();
  });

  it("should throw EngineError when no results to aggregate in MajorityVoteStrategy", () => {
    const strategy = new MajorityVoteStrategy();
    expect(() => strategy.aggregateResults(new Map())).toThrow(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        i18nKey: "ensemble.errors.noResults",
      }),
    );
  });

  it("should throw EngineError when search() is called before load()", async () => {
    const e1 = mockEngine("e1", "e2e4");
    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1],
      new MajorityVoteStrategy(),
    );
    // status is "uninitialized" — not "ready"
    await expect(
      ensemble.search({ fen: createPositionString("startpos") }),
    ).rejects.toMatchObject({
      code: "NOT_READY",
    });
  });

  it("should set status to 'error' and throw when a sub-engine fails during search()", async () => {
    const e1 = mockEngine("e1", "e2e4");
    const e2 = {
      ...mockEngine("e2", "d2d4"),
      search: vi.fn().mockRejectedValue(new Error("engine crashed")),
    } as unknown as IEngine;

    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1, e2],
      new MajorityVoteStrategy(),
    );
    await ensemble.load();

    await expect(
      ensemble.search({ fen: createPositionString("startpos") }),
    ).rejects.toBeDefined();
    expect(ensemble.status).toBe("error");
    expect(ensemble.lastError).not.toBeNull();
  });

  it("should set status to 'error' when any sub-engine is in error during load()", async () => {
    const e1 = mockEngine("e1", "e2e4");
    const e2 = {
      ...mockEngine("e2", "d2d4"),
      load: vi.fn().mockRejectedValue(new Error("load failed")),
    } as unknown as IEngine;

    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1, e2],
      new MajorityVoteStrategy(),
    );
    await expect(ensemble.load()).rejects.toBeDefined();
    expect(ensemble.status).toBe("error");
  });

  it("should propagate consent() to all sub-engines", () => {
    const e1 = mockEngine("e1", "e2e4");
    const e2 = mockEngine("e2", "d2d4");
    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1, e2],
      new MajorityVoteStrategy(),
    );
    ensemble.consent();
    expect(e1.consent).toHaveBeenCalled();
    expect(e2.consent).toHaveBeenCalled();
  });

  it("stop() should call stop() on all sub-engines and reset status to 'ready'", async () => {
    const e1 = mockEngine("e1", "e2e4");
    const e2 = mockEngine("e2", "d2d4");
    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1, e2],
      new MajorityVoteStrategy(),
    );
    await ensemble.load();
    ensemble.stop();
    expect(e1.stop).toHaveBeenCalled();
    expect(e2.stop).toHaveBeenCalled();
    expect(ensemble.status).toBe("ready");
  });

  it("dispose() should call dispose() on all sub-engines and set status to 'disposed'", async () => {
    const e1 = mockEngine("e1", "e2e4");
    const e2 = mockEngine("e2", "d2d4");
    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1, e2],
      new MajorityVoteStrategy(),
    );
    await ensemble.load();
    await ensemble.dispose();
    expect(e1.dispose).toHaveBeenCalled();
    expect(e2.dispose).toHaveBeenCalled();
    expect(ensemble.status).toBe("disposed");
  });

  it("onInfo() unsubscribe should call all sub-engine unsubs", () => {
    const unsub1 = vi.fn();
    const unsub2 = vi.fn();
    const e1 = {
      ...mockEngine("e1", "e2e4"),
      onInfo: vi.fn().mockReturnValue(unsub1),
    } as unknown as IEngine;
    const e2 = {
      ...mockEngine("e2", "d2d4"),
      onInfo: vi.fn().mockReturnValue(unsub2),
    } as unknown as IEngine;
    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1, e2],
      new MajorityVoteStrategy(),
    );
    const unsubAll = ensemble.onInfo(() => {});
    unsubAll();
    expect(unsub1).toHaveBeenCalled();
    expect(unsub2).toHaveBeenCalled();
  });

  it("onStatusChange() aggregates: error > busy > ready", () => {
    const statusCallbacks: Array<(s: string) => void> = [];
    const e1 = {
      ...mockEngine("e1", "e2e4"),
      status: "ready" as const,
      onStatusChange: vi.fn((cb: (s: string) => void) => {
        statusCallbacks.push(cb);
        return () => {};
      }),
    } as unknown as IEngine;
    const e2 = {
      ...mockEngine("e2", "d2d4"),
      status: "ready" as const,
      onStatusChange: vi.fn((cb: (s: string) => void) => {
        statusCallbacks.push(cb);
        return () => {};
      }),
    } as unknown as IEngine;

    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1, e2],
      new MajorityVoteStrategy(),
    );
    const received: string[] = [];
    ensemble.onStatusChange((s) => received.push(s));

    // Simulate e1 going to "error"
    (e1 as unknown as { status: string }).status = "error";
    statusCallbacks[0]!("error");
    expect(received.at(-1)).toBe("error");
    expect(ensemble.status).toBe("error");

    // Simulate e1 recovering but e2 goes busy
    (e1 as unknown as { status: string }).status = "ready";
    (e2 as unknown as { status: string }).status = "busy";
    statusCallbacks[1]!("busy");
    expect(received.at(-1)).toBe("busy");
    expect(ensemble.status).toBe("busy");

    // Both ready
    (e2 as unknown as { status: string }).status = "ready";
    statusCallbacks[1]!("ready");
    expect(received.at(-1)).toBe("ready");
    expect(ensemble.status).toBe("ready");
  });

  it("use() and unuse() should propagate to all sub-engines", () => {
    const e1 = mockEngine("e1", "e2e4");
    const e2 = mockEngine("e2", "d2d4");
    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1, e2],
      new MajorityVoteStrategy(),
    );
    const mw = { id: "test-mw" } as IMiddleware;
    ensemble.use(mw);
    expect(e1.use).toHaveBeenCalledWith(mw);
    expect(e2.use).toHaveBeenCalledWith(mw);
    ensemble.unuse("test-mw");
    expect(e1.unuse).toHaveBeenCalledWith("test-mw");
    expect(e2.unuse).toHaveBeenCalledWith("test-mw");
  });

  it("onTelemetry() unsubscribe should call all sub-engine unsubs", () => {
    const unsub1 = vi.fn();
    const unsub2 = vi.fn();
    const e1 = {
      ...mockEngine("e1", "e2e4"),
      onTelemetry: vi.fn().mockReturnValue(unsub1),
    } as unknown as IEngine;
    const e2 = {
      ...mockEngine("e2", "d2d4"),
      onTelemetry: vi.fn().mockReturnValue(unsub2),
    } as unknown as IEngine;
    const ensemble = new EnsembleAdapter(
      "ens",
      "Ensemble",
      "1.0",
      [e1, e2],
      new MajorityVoteStrategy(),
    );
    const cb = (_t: EngineTelemetry) => {};
    const unsubAll = ensemble.onTelemetry(cb);
    unsubAll();
    expect(unsub1).toHaveBeenCalled();
    expect(unsub2).toHaveBeenCalled();
  });
});
