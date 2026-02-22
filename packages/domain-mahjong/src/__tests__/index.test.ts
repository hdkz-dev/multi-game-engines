import { describe, it, expect } from "vitest";
import { createMahjongMove, validateMahjongBoard } from "../index.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

describe("Mahjong Domain", () => {
  it("should validate move format", () => {
    const move = createMahjongMove("1m");
    expect(move).toBe("1m");
  });

  it("should throw VALIDATION_ERROR on invalid move", () => {
    let err: unknown;
    try {
      createMahjongMove("invalid");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EngineError);
    if (err instanceof EngineError) {
      expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
    }
  });

  it("should validate board structures", () => {
    const board = { tiles: ["1m", "2m"] };
    expect(() => validateMahjongBoard(board)).not.toThrow();
  });

  it("should throw VALIDATION_ERROR on injection in board strings", () => {
    const board = { tiles: ["1m\nstop"] };
    let err: unknown;
    try {
      validateMahjongBoard(board);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EngineError);
    if (err instanceof EngineError) {
      expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
    }
  });
});
