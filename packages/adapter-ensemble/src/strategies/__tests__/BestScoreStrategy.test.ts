import { describe, it, expect } from "vitest";
import { BestScoreStrategy } from "../BestScoreStrategy.js";
import { IBaseSearchResult } from "@multi-game-engines/core";

describe("BestScoreStrategy", () => {
  it("should select the move with the highest cp score", () => {
    const strategy = new BestScoreStrategy();
    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: "a2a3", score: { cp: 10 } }],
      ["e2", { bestMove: "a2a4", score: { cp: 50 } }],
      ["e3", { bestMove: "h2h3", score: { cp: -10 } }],
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    expect(winner.bestMove).toBe("a2a4");
  });

  it("should prioritize mate scores over centipawn scores", () => {
    const strategy = new BestScoreStrategy();
    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: "a2a3", score: { cp: 2000 } }], // High CP
      ["e2", { bestMove: "a2a4", score: { mate: 5 } }], // Mate in 5
      ["e3", { bestMove: "h2h3", score: { mate: 2 } }], // Mate in 2 (Better than mate in 5)
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    expect(winner.bestMove).toBe("h2h3");
  });

  it("should select the move with the highest winrate if cp is missing", () => {
    const strategy = new BestScoreStrategy();
    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: "a2a3", score: { winrate: 0.5 } }],
      ["e2", { bestMove: "a2a4", score: { winrate: 0.8 } }],
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    expect(winner.bestMove).toBe("a2a4");
  });
});
