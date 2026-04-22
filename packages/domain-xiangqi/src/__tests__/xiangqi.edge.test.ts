/**
 * Xiangqi (Chinese Chess) – official rules edge case tests.
 *
 * 9x10 board: columns a-i (9), rows 0-9 (10).
 * Move format (UCCI): [a-i][0-9][a-i][0-9]  OR  resign | none
 *   - Column: a-i (9 columns, must be lowercase)
 *   - Row: 0-9 (10 rows, 0 = top/black side, 9 = bottom/red side)
 *   - 'resign': player resigns
 *   - 'none': no legal moves (similar to checkmate/stalemate indicator)
 *
 * XFEN: minimal validation (non-empty string only; no field parsing).
 *
 * Note: createXiangqiMove performs injection detection (control characters →
 * SECURITY_ERROR) before format validation. createXFEN delegates to
 * createPositionString which also rejects control characters with SECURITY_ERROR.
 */
import { describe, it, expect } from "vitest";
import { createXiangqiMove, createXFEN } from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

// ---------------------------------------------------------------------------
// createXiangqiMove – valid inputs
// ---------------------------------------------------------------------------
describe("createXiangqiMove – valid inputs", () => {
  it("accepts minimum coordinate 'a0a0'", () => {
    expect(createXiangqiMove("a0a0")).toBe("a0a0");
  });

  it("accepts maximum coordinate 'i9i9'", () => {
    expect(createXiangqiMove("i9i9")).toBe("i9i9");
  });

  it("accepts all 9 valid columns (a-i)", () => {
    for (const col of ["a", "b", "c", "d", "e", "f", "g", "h", "i"]) {
      expect(createXiangqiMove(`${col}0a1`)).toBe(`${col}0a1`);
    }
  });

  it("accepts all 10 valid rows (0-9)", () => {
    for (let row = 0; row <= 9; row++) {
      expect(createXiangqiMove(`a${row}b${row}`)).toBe(`a${row}b${row}`);
    }
  });

  it("accepts typical red-side opening 'h0g2'", () => {
    expect(createXiangqiMove("h0g2")).toBe("h0g2");
  });

  it("accepts 'resign'", () => {
    expect(createXiangqiMove("resign")).toBe("resign");
  });

  it("accepts 'none'", () => {
    expect(createXiangqiMove("none")).toBe("none");
  });

  it("accepts board center move 'e4e5'", () => {
    expect(createXiangqiMove("e4e5")).toBe("e4e5");
  });
});

// ---------------------------------------------------------------------------
// createXiangqiMove – invalid inputs
// ---------------------------------------------------------------------------
describe("createXiangqiMove – invalid inputs", () => {
  it("throws VALIDATION_ERROR for column 'j' (out of a-i)", () => {
    expect(() => createXiangqiMove("j0a1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for uppercase column 'A0a1'", () => {
    expect(() => createXiangqiMove("A0a1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for two-digit row 'a10a1'", () => {
    expect(() => createXiangqiMove("a10a1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for partial move 'a0a' (missing to-row)", () => {
    expect(() => createXiangqiMove("a0a")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createXiangqiMove("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for 'RESIGN' (must be lowercase)", () => {
    expect(() => createXiangqiMove("RESIGN")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for 'NONE' (must be lowercase)", () => {
    expect(() => createXiangqiMove("NONE")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for control character injection", () => {
    expect(() => createXiangqiMove("a0a1\nstop")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string (null)", () => {
    expect(() => createXiangqiMove(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});

// ---------------------------------------------------------------------------
// createXFEN – valid and invalid inputs
// ---------------------------------------------------------------------------
describe("createXFEN", () => {
  it("accepts standard initial XFEN string", () => {
    const xfen =
      "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";
    expect(createXFEN(xfen)).toBe(xfen);
  });

  it("accepts 'startpos' string (minimal validation)", () => {
    expect(createXFEN("startpos")).toBe("startpos");
  });

  it("accepts single character position string", () => {
    expect(createXFEN("x")).toBe("x");
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createXFEN("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createXFEN("   ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input (null)", () => {
    expect(() => createXFEN(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for control character injection via createPositionString", () => {
    // createPositionString detects injection even though createXFEN itself
    // does not call assertNoInjection explicitly.
    expect(() => createXFEN("startpos\nquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });
});
