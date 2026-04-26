/**
 * Reversi (Othello) – official rules edge case tests.
 *
 * Move format: [a-h][1-8]  OR  PS (case-insensitive pass)
 *   - 8x8 board: columns a-h, rows 1-8
 *   - PS = pass move (when no valid moves available)
 *   - Case-insensitive: 'D3', 'd3', 'D3' all valid
 *
 * Board string: any non-empty string (injection-checked).
 */
import { describe, it, expect } from "vitest";
import {
  createReversiMove,
  createReversiBoard,
  REVERSI_MOVE_REGEX,
} from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

// ---------------------------------------------------------------------------
// createReversiMove – valid inputs
// ---------------------------------------------------------------------------
describe("createReversiMove – valid inputs", () => {
  it("accepts all 64 squares (a-h × 1-8)", () => {
    for (const col of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      for (let row = 1; row <= 8; row++) {
        const move = `${col}${row}`;
        expect(() => createReversiMove(move)).not.toThrow();
      }
    }
  });

  it("accepts uppercase column: 'D3'", () => {
    expect(() => createReversiMove("D3")).not.toThrow();
  });

  it("accepts all uppercase columns A-H", () => {
    for (const col of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
      expect(() => createReversiMove(`${col}4`)).not.toThrow();
    }
  });

  it("accepts pass 'PS' (uppercase)", () => {
    expect(() => createReversiMove("PS")).not.toThrow();
  });

  it("accepts pass 'ps' (lowercase)", () => {
    expect(() => createReversiMove("ps")).not.toThrow();
  });

  it("accepts pass 'Ps' (mixed case)", () => {
    expect(() => createReversiMove("Ps")).not.toThrow();
  });

  it("accepts pass 'pS' (mixed case)", () => {
    expect(() => createReversiMove("pS")).not.toThrow();
  });

  it("accepts corner squares a1, a8, h1, h8", () => {
    expect(() => createReversiMove("a1")).not.toThrow();
    expect(() => createReversiMove("a8")).not.toThrow();
    expect(() => createReversiMove("h1")).not.toThrow();
    expect(() => createReversiMove("h8")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// createReversiMove – invalid inputs
// ---------------------------------------------------------------------------
describe("createReversiMove – invalid inputs", () => {
  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createReversiMove("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createReversiMove("  ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for column 'i' (out of a-h)", () => {
    expect(() => createReversiMove("i4")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for row '0' (rows start at 1)", () => {
    expect(() => createReversiMove("a0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for row '9' (rows end at 8)", () => {
    expect(() => createReversiMove("a9")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for 'z9' (both column and row out of range)", () => {
    expect(() => createReversiMove("z9")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for null byte injection", () => {
    expect(() => createReversiMove("d3\0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for newline injection", () => {
    expect(() => createReversiMove("d3\nstop")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input (number)", () => {
    expect(() => createReversiMove(34 as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input (null)", () => {
    expect(() => createReversiMove(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});

// ---------------------------------------------------------------------------
// REVERSI_MOVE_REGEX spot checks
// ---------------------------------------------------------------------------
describe("REVERSI_MOVE_REGEX", () => {
  it("matches valid squares and PS (case insensitive)", () => {
    expect(REVERSI_MOVE_REGEX.test("a1")).toBe(true);
    expect(REVERSI_MOVE_REGEX.test("h8")).toBe(true);
    expect(REVERSI_MOVE_REGEX.test("PS")).toBe(true);
    expect(REVERSI_MOVE_REGEX.test("ps")).toBe(true);
  });

  it("rejects invalid inputs", () => {
    expect(REVERSI_MOVE_REGEX.test("i1")).toBe(false);
    expect(REVERSI_MOVE_REGEX.test("a9")).toBe(false);
    expect(REVERSI_MOVE_REGEX.test("")).toBe(false);
    expect(REVERSI_MOVE_REGEX.test("a0")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createReversiBoard
// ---------------------------------------------------------------------------
describe("createReversiBoard", () => {
  it("accepts a typical board position string", () => {
    const pos = "BWBWBWBWWBWBWBWB";
    expect(createReversiBoard(pos)).toBe(pos);
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createReversiBoard("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createReversiBoard("   ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input", () => {
    expect(() => createReversiBoard(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for control character injection", () => {
    expect(() => createReversiBoard("BWBW\nquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for tab injection", () => {
    expect(() => createReversiBoard("BWBW\tquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });
});
