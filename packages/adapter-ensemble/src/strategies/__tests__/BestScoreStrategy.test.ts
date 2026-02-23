import { describe, it, expect } from "vitest";
import { BestScoreStrategy } from "../BestScoreStrategy.js";
import { IBaseSearchResult } from "@multi-game-engines/core";

describe("BestScoreStrategy", () => {
  it("should select the move with the highest cp score", () => {
    const strategy = new BestScoreStrategy();
    const results: IBaseSearchResult[] = [
      { bestMove: "a2a3", score: { cp: 10 } },
      { bestMove: "a2a4", score: { cp: 50 } },
      { bestMove: "h2h3", score: { cp: -10 } },
    ];

    const winner = strategy.aggregateResults(results);
    expect(winner.bestMove).toBe("a2a4");
  });

  it("should select the move with the highest winrate if cp is missing", () => {
    const strategy = new BestScoreStrategy();
    const results: IBaseSearchResult[] = [
      { bestMove: "a2a3", score: { winrate: 0.5 } },
      { bestMove: "a2a4", score: { winrate: 0.8 } },
    ];

    const winner = strategy.aggregateResults(results);
    expect(winner.bestMove).toBe("a2a4");
  });
});
