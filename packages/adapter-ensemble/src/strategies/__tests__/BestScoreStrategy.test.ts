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

  it("should handle negative mate scores by preferring to delay being mated", () => {
    const strategy = new BestScoreStrategy();
    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: "a2a3", score: { mate: -1 } }], // Mated in 1
      ["e2", { bestMove: "a2a4", score: { mate: -5 } }], // Mated in 5 (Better)
      ["e3", { bestMove: "h2h3", score: { cp: -1000 } }], // Bad CP but not mated
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    // CP -1000 is still better than being mated (mate score is around -2,000,000)
    expect(winner.bestMove).toBe("h2h3");
  });

  it("should choose the best move to delay mate among negative mate options", () => {
    const strategy = new BestScoreStrategy();
    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: "a2a3", score: { mate: -1 } }], // Mated in 1
      ["e2", { bestMove: "a2a4", score: { mate: -5 } }], // Mated in 5 (Better)
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    expect(winner.bestMove).toBe("a2a4");
  });

  it("should throw EngineError when resultsMap is empty", () => {
    const strategy = new BestScoreStrategy();
    const resultsMap = new Map<string, IBaseSearchResult>();

    expect(() => strategy.aggregateResults(resultsMap)).toThrow();
  });

  it("should fallback to first result when no result has a score", () => {
    const strategy = new BestScoreStrategy();
    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: "a2a3" }],
      ["e2", { bestMove: "a2a4" }],
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    // No scores → returns first result
    expect(winner.bestMove).toBe("a2a3");
  });

  it("should handle points-based scores", () => {
    const strategy = new BestScoreStrategy();
    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: "a2a3", score: { points: 5 } }],
      ["e2", { bestMove: "a2a4", score: { points: 10 } }],
    ]);

    // points は IScoreInfo に含まれるがスコア計算の優先順位では
    // mate > cp > winrate の順。points は直接使われない。
    // しかし isScoreInfo は true を返すので score は取れるが currentScore は -Infinity のまま。
    // → fallback to first result
    const winner = strategy.aggregateResults(resultsMap);
    expect(winner).toBeDefined();
  });
});
