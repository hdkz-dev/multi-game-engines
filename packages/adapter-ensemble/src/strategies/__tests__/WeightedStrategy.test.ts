import { describe, it, expect, vi } from "vitest";
import { WeightedStrategy } from "../WeightedStrategy.js";
import { IBaseSearchResult } from "@multi-game-engines/core";

describe("WeightedStrategy", () => {
  it("should select the move with highest total weight", () => {
    // spy on console.debug to verify i18n logging
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    
    // engine3 has high weight, so its move should win despite being the minority by engine count
    const strategy = new WeightedStrategy({
      engine1: 1.0,
      engine2: 1.0,
      engine3: 3.0,
    });

    expect(debugSpy).toHaveBeenCalled();
    const logCall = debugSpy.mock.calls[0]?.[0];
    // i18n サブモジュール経由で正しく翻訳されているか確認
    expect(logCall).toContain("engine1, engine2, engine3");
    
    debugSpy.mockRestore();

    const resultsMap = new Map<string, IBaseSearchResult>([
      ["engine1", { bestMove: "a2a3" }],
      ["engine2", { bestMove: "a2a3" }],
      ["engine3", { bestMove: "a2a4" }],
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    expect(winner.bestMove).toBe("a2a4");
  });

  it("should ignore results with null or undefined bestMove", () => {
    const strategy = new WeightedStrategy();

    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: null }],
      ["e2", { bestMove: undefined }],
      ["e3", { bestMove: "e2e4" }],
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    expect(winner.bestMove).toBe("e2e4");
  });
});
