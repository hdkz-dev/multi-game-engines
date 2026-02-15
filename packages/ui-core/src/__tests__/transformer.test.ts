import { describe, it, expect } from "vitest";
import { SearchStateTransformer } from "../transformer.js";
import { createInitialState, PositionString } from "../types.js";
import { ExtendedSearchInfo } from "../schema.js";

describe("SearchStateTransformer", () => {
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
      pv: ["e2e4", "e7e5"],
      score: { cp: 50 },
    };
    let state = SearchStateTransformer.mergeInfo(initialState, info1);

    expect(state.pvs).toHaveLength(1);
    expect(state.pvs[0].multipv).toBe(2);

    const info2: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["d2d4", "d7d5"],
      score: { cp: 60 },
    };
    state = SearchStateTransformer.mergeInfo(state, info2);

    expect(state.pvs).toHaveLength(2);
    expect(state.pvs[0].multipv).toBe(1);
    expect(state.pvs[1].multipv).toBe(2);
  });

  it("should update existing PV", () => {
    const info1: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["e2e4"],
      score: { cp: 10 },
    };
    let state = SearchStateTransformer.mergeInfo(initialState, info1);

    const info2: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["e2e4", "e7e5"],
      score: { cp: 20 },
    };
    state = SearchStateTransformer.mergeInfo(state, info2);

    expect(state.pvs).toHaveLength(1);
    expect(state.pvs[0].score.value).toBe(20);
    expect(state.pvs[0].moves).toEqual(["e2e4", "e7e5"]);
  });

  it("should handle mate scores", () => {
    const info: ExtendedSearchInfo = {
      multipv: 1,
      pv: ["f2f3"],
      score: { mate: 5 },
    };
    const state = SearchStateTransformer.mergeInfo(initialState, info);

    expect(state.pvs[0].score.type).toBe("mate");
    expect(state.pvs[0].score.value).toBe(5);
  });
});
