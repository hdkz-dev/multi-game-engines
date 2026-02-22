import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createReversiMove } from "../index.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

beforeAll(() => {
  vi.spyOn(performance, "now").mockReturnValue(0);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("Reversi Domain", () => {
  it("should validate move format", () => {
    const move = createReversiMove("d3");
    expect(move).toBe("d3");
  });

  it("should throw VALIDATION_ERROR on invalid injection characters", () => {
    let err: unknown;
    try {
      createReversiMove("d3\0");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EngineError);
    if (err instanceof EngineError) {
      expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
    }
  });
});
