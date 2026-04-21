/**
 * Janggi (Korean Chess) – official rules edge case tests.
 *
 * Janggi uses a 9x10 board (9 columns a-i, 10 rows 0-9).
 * Move format: [a-i][0-9][a-i][0-9]  OR  resign | pass
 *   - Column: a-i (9 columns)
 *   - Row: 0-9 (10 rows, unlike most Western games that start from 1)
 *
 * Note: the implementation does NOT perform injection detection on moves or
 * positions — control characters cause VALIDATION_ERROR via regex failure.
 */
import { describe, it, expect } from "vitest";
import { createJanggiMove, createJanggiPosition } from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

describe("createJanggiMove – valid inputs", () => {
  it("accepts minimum coordinate: 'a0a0'", () => {
    expect(createJanggiMove("a0a0")).toBe("a0a0");
  });

  it("accepts maximum coordinate: 'i9i9'", () => {
    expect(createJanggiMove("i9i9")).toBe("i9i9");
  });

  it("accepts all 9 columns (a-i) in from-column", () => {
    for (const col of ["a", "b", "c", "d", "e", "f", "g", "h", "i"]) {
      expect(createJanggiMove(`${col}0a1`)).toBe(`${col}0a1`);
    }
  });

  it("accepts all 10 rows (0-9) in from-row", () => {
    for (let row = 0; row <= 9; row++) {
      expect(createJanggiMove(`a${row}b${row}`)).toBe(`a${row}b${row}`);
    }
  });

  it("accepts 'pass' (no move available)", () => {
    expect(createJanggiMove("pass")).toBe("pass");
  });

  it("accepts 'resign'", () => {
    expect(createJanggiMove("resign")).toBe("resign");
  });

  it("accepts typical game moves: 'e0d0', 'd0e0', 'a0b0'", () => {
    expect(createJanggiMove("e0d0")).toBe("e0d0");
    expect(createJanggiMove("d0e0")).toBe("d0e0");
    expect(createJanggiMove("a0b0")).toBe("a0b0");
  });
});

describe("createJanggiMove – invalid inputs", () => {
  it("throws VALIDATION_ERROR for invalid column 'j' (out of a-i)", () => {
    expect(() => createJanggiMove("j0a1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for uppercase column 'A0a1' (must be lowercase)", () => {
    expect(() => createJanggiMove("A0a1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for too-long move 'a0a10' (row must be single digit)", () => {
    expect(() => createJanggiMove("a0a10")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for too-short move 'a0a' (missing to-row)", () => {
    expect(() => createJanggiMove("a0a")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for partial move 'a0'", () => {
    expect(() => createJanggiMove("a0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createJanggiMove("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for 'RESIGN' (must be lowercase)", () => {
    expect(() => createJanggiMove("RESIGN")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for control character injection (regex failure)", () => {
    expect(() => createJanggiMove("a0a1\nstop")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input", () => {
    expect(() => createJanggiMove(null as unknown as string)).toThrow();
  });
});

describe("createJanggiPosition", () => {
  it("accepts 'startpos'", () => {
    expect(createJanggiPosition("startpos")).toBe("startpos");
  });

  it("accepts arbitrary position string", () => {
    expect(createJanggiPosition("custom-fen-string")).toBe("custom-fen-string");
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createJanggiPosition("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createJanggiPosition("   ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input", () => {
    expect(() => createJanggiPosition(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for control character injection via createPositionString", () => {
    // createPositionString performs injection detection even though JanggiPosition
    // itself does not call assertNoInjection explicitly.
    expect(() => createJanggiPosition("fen\nquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });
});
