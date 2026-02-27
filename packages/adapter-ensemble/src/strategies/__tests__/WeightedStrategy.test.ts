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

  it("should ignore results with empty string bestMove", () => {
    const strategy = new WeightedStrategy();

    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: "" }],
      ["e2", { bestMove: "e2e4" }],
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    expect(winner.bestMove).toBe("e2e4");
  });

  it("should throw EngineError when resultsMap is empty", () => {
    const strategy = new WeightedStrategy();
    const resultsMap = new Map<string, IBaseSearchResult>();

    expect(() => strategy.aggregateResults(resultsMap)).toThrow();
  });

  it("should fallback to first result when all bestMove values are falsy", () => {
    const strategy = new WeightedStrategy();

    const resultsMap = new Map<string, IBaseSearchResult>([
      ["e1", { bestMove: null }],
      ["e2", { bestMove: undefined }],
    ]);

    // winnerMove is null → returns first entry via resultsMap.values().next().value
    const winner = strategy.aggregateResults(resultsMap);
    expect(winner).toBeDefined();
    expect(winner.bestMove).toBeNull();
  });

  it("should warn when engine has no weight configured", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    const strategy = new WeightedStrategy({
      engine1: 2.0,
      // engine2 has no weight
    });
    debugSpy.mockRestore();

    const resultsMap = new Map<string, IBaseSearchResult>([
      ["engine1", { bestMove: "a2a3" }],
      ["engine2", { bestMove: "a2a4" }], // not in weights
    ]);

    strategy.aggregateResults(resultsMap);
    // engine2 に重みが設定されていない旨の warn が出るはず
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should default weight to 1.0 for engines without explicit weight", () => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // engine1 weight=1.0, engine2 weight=default(1.0) → tie
    // engine3 weight=2.0 → wins
    const strategy = new WeightedStrategy({
      engine1: 1.0,
      engine3: 2.0,
    });

    const resultsMap = new Map<string, IBaseSearchResult>([
      ["engine1", { bestMove: "a2a3" }],
      ["engine2", { bestMove: "a2a3" }], // default weight 1.0
      ["engine3", { bestMove: "a2a4" }], // weight 2.0
    ]);

    const winner = strategy.aggregateResults(resultsMap);
    // engine1 + engine2 = 1.0 + 1.0 = 2.0, engine3 = 2.0 → tie, but engine1's move gets 2.0 first
    expect(winner.bestMove).toBe("a2a3");

    vi.restoreAllMocks();
  });
});
