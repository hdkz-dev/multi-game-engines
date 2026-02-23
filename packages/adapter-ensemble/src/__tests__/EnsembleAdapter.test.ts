import { describe, it, expect, vi } from "vitest";
import { EnsembleAdapter } from "../EnsembleAdapter.js";
import { MajorityVoteStrategy } from "../strategies/MajorityVoteStrategy.js";
import {
  IEngine,
  IBaseSearchResult,
  PositionString,
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
      fen: "startpos" as PositionString,
    });

    expect(result.bestMove).toBe("e2e4");
    expect(e1.search).toHaveBeenCalled();
    expect(e2.search).toHaveBeenCalled();
    expect(e3.search).toHaveBeenCalled();
  });

  it("should throw EngineError when no results to aggregate in MajorityVoteStrategy", () => {
    const strategy = new MajorityVoteStrategy();
    expect(() => strategy.aggregateResults([])).toThrow(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        engineId: "majority-vote",
        i18nKey: "adapters.ensemble.errors.noResults",
      }),
    );
  });
});
