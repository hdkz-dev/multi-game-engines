import { describe, it, expect } from "vitest";
import { createMahjongMove, validateMahjongBoard } from "../index.js";

describe("Mahjong Domain", () => {
  it("should validate move format", () => {
    const move = createMahjongMove("1m");
    expect(move).toBe("1m");
  });

  it("should validate board structures", () => {
    const board = { tiles: ["1m", "2m"] };
    expect(() => validateMahjongBoard(board)).not.toThrow();
  });

  it("should throw on injection in board strings", () => {
    const board = { tiles: ["1m\nstop"] };
    expect(() => validateMahjongBoard(board)).toThrow();
  });
});
