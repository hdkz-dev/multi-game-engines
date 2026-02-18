import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { SearchStateTransformer } from "../transformer.js";
import { createInitialState, PositionString } from "../types.js";
import { ExtendedSearchInfo } from "../schema.js";
import { createMove } from "@multi-game-engines/core";

describe("SearchStateTransformer", () => {
  beforeAll(() => {
    vi.spyOn(Date, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const initialState = createInitialState(
    "startpos" as unknown as PositionString,
  );

  it("should update basic statistics", () => {
    const info: ExtendedSearchInfo = {
      depth: 10,
      nodes: 1000,
      nps: 500,
      time: 200,
    };
    const nextState = SearchStateTransformer.mergeInfo(initialState, info);

    expect(nextState.stats.depth).toBe(10);
    expect(nextState.stats.nodes).toBe(1000);
    expect(nextState.stats.nps).toBe(500);
    expect(nextState.stats.time).toBe(200);
  });

  it("should handle MultiPV updates and maintain order", () => {
    const info1: ExtendedSearchInfo = {
      multipv: 2,
      pv: ["e2e4", "e7e5"].map(createMove),
      score: { cp: 50 },
    };
    let state = SearchStateTransformer.mergeInfo(initialState, info1);

    expect(state.pvs).toHaveLength(1);
    expect(state.pvs[0]?.multipv).toBe(2);

    const info2: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["d2d4", "d7d5"].map(createMove),
      score: { cp: 60 },
    };
    state = SearchStateTransformer.mergeInfo(state, info2);

    expect(state.pvs).toHaveLength(2);
    expect(state.pvs[0]?.multipv).toBe(1);
    expect(state.pvs[1]?.multipv).toBe(2);
  });

  it("should update existing PV", () => {
    const info1: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["e2e4"].map(createMove),
      score: { cp: 10 },
    };
    let state = SearchStateTransformer.mergeInfo(initialState, info1);

    const info2: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["e2e4", "e7e5"].map(createMove),
      score: { cp: 20 },
    };
    state = SearchStateTransformer.mergeInfo(state, info2);

    expect(state.pvs).toHaveLength(1);
    expect(state.pvs[0]?.score.value).toBe(20);
    expect(state.pvs[0]?.moves).toEqual(["e2e4", "e7e5"]);
  });

  it("should handle mate scores", () => {
    const info: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["f2f3"].map(createMove),
      score: { mate: 5 },
    };
    const state = SearchStateTransformer.mergeInfo(initialState, info);

    expect(state.pvs[0]?.score.type).toBe("mate");
    expect(state.pvs[0]?.score.value).toBe(5);
  });

  it("should handle negative mate scores (opponent winning)", () => {
    const info: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["e2e4"].map(createMove),
      score: { mate: -3 },
    };
    const state = SearchStateTransformer.mergeInfo(initialState, info);

    expect(state.pvs[0]?.score.type).toBe("mate");
    expect(state.pvs[0]?.score.value).toBe(-3);
  });

  it("should handle missing score gracefully (defaults to cp: 0)", () => {
    const info: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["d2d4"].map(createMove),
      // score is omitted
    };
    const state = SearchStateTransformer.mergeInfo(initialState, info);

    expect(state.pvs[0]?.score.type).toBe("cp");
    expect(state.pvs[0]?.score.value).toBe(0);
  });

  it("should prioritize mate over cp when both are present", () => {
    const info: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["g2g4"].map(createMove),
      score: { cp: 100, mate: 2 },
    };
    const state = SearchStateTransformer.mergeInfo(initialState, info);

    // mate takes priority in the transformer logic
    expect(state.pvs[0]?.score.type).toBe("mate");
    expect(state.pvs[0]?.score.value).toBe(2);
  });
});
