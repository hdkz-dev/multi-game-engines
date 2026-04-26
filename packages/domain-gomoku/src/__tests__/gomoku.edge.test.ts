/**
 * Gomoku – official rules edge case tests.
 *
 * Move format: [a-zA-Z][1-9][0-9]?  OR  resign | pass
 *   - Column: any letter a-z or A-Z (case-sensitive, no normalization)
 *   - Row: 1-9 or 10-19 (two digits starting with 1-9)
 *   - Standard 15x15 uses a-o / 1-15, 19x19 uses a-s / 1-19
 *   - The validator enforces pattern only; row range beyond 2 digits is
 *     unrestricted (e.g., h99 matches regex but is not a valid board square)
 */
import { describe, it, expect } from "vitest";
import { createGomokuMove, createGomokuPositionString } from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

describe("createGomokuMove – valid inputs", () => {
  it("accepts single-digit row: 'h8'", () => {
    expect(createGomokuMove("h8")).toBe("h8");
  });

  it("accepts two-digit row on 15x15 board: 'o15'", () => {
    expect(createGomokuMove("o15")).toBe("o15");
  });

  it("accepts two-digit row on 19x19 board: 's19'", () => {
    expect(createGomokuMove("s19")).toBe("s19");
  });

  it("accepts row 10: 'a10'", () => {
    expect(createGomokuMove("a10")).toBe("a10");
  });

  it("accepts uppercase column letter (not normalized): 'H8'", () => {
    expect(createGomokuMove("H8")).toBe("H8");
  });

  it("accepts uppercase with two-digit row: 'O15'", () => {
    expect(createGomokuMove("O15")).toBe("O15");
  });

  it("accepts minimum position 'a1'", () => {
    expect(createGomokuMove("a1")).toBe("a1");
  });

  it("accepts 'resign'", () => {
    expect(createGomokuMove("resign")).toBe("resign");
  });

  it("accepts 'pass'", () => {
    expect(createGomokuMove("pass")).toBe("pass");
  });
});

describe("createGomokuMove – invalid inputs", () => {
  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createGomokuMove("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws for row starting with '0': 'h0' (0 not in [1-9])", () => {
    expect(() => createGomokuMove("h0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws for digit-only input '15' (missing column letter)", () => {
    expect(() => createGomokuMove("15")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws for letter-only input 'h' (missing row digit)", () => {
    expect(() => createGomokuMove("h")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws for 'RESIGN' (must be lowercase 'resign')", () => {
    expect(() => createGomokuMove("RESIGN")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for injection attempt 'h8\\nquit'", () => {
    expect(() => createGomokuMove("h8\nquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws for non-string input", () => {
    expect(() => createGomokuMove(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});

describe("createGomokuPositionString", () => {
  it("accepts valid position strings", () => {
    expect(createGomokuPositionString("15x15")).toBe("15x15");
    expect(createGomokuPositionString("startpos")).toBe("startpos");
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createGomokuPositionString("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createGomokuPositionString("   ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for newline injection", () => {
    expect(() => createGomokuPositionString("pos\nquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for tab injection", () => {
    expect(() => createGomokuPositionString("pos\tquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for null byte injection", () => {
    expect(() => createGomokuPositionString("pos\0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input", () => {
    expect(() => createGomokuPositionString(42 as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});
