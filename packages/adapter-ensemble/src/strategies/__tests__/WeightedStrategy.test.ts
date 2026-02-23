import { describe, it, expect } from "vitest";
import { WeightedStrategy } from "../WeightedStrategy.js";
import { IBaseSearchResult } from "@multi-game-engines/core";

describe("WeightedStrategy", () => {
  it("should select the most voted move (placeholder for weighted logic)", () => {
    // Note: Weights are currently uniform in the implementation until engine IDs are passed
    const strategy = new WeightedStrategy();

    const results: IBaseSearchResult[] = [
      { bestMove: "a2a3" },
      { bestMove: "a2a3" },
      { bestMove: "a2a4" },
    ];

    const winner = strategy.aggregateResults(results);
    expect(winner.bestMove).toBe("a2a3");
  });
});
