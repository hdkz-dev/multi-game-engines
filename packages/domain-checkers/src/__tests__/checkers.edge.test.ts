/**
 * Checkers (Draughts) – official rules edge case tests.
 *
 * English checkers: 8x8 board, 32 playable dark squares numbered 1-32.
 * Move format: \d+-\d+  OR  (none)
 *   - Normal move:  e.g., "11-15"
 *   - Jump (capture): e.g., "11-18" (same format as normal but longer distance)
 *   - (none): no move available (game over)
 *   Note: the implementation uses \d+-\d+ with no upper bound on square
 *   numbers — this test documents actual implementation behavior.
 *
 * Board string: any non-empty string without control characters.
 */
import { describe, it, expect } from "vitest";
import { createCheckersBoard, createCheckersMove } from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

// ---------------------------------------------------------------------------
// createCheckersMove – valid inputs
// ---------------------------------------------------------------------------
describe("createCheckersMove – valid inputs", () => {
  it("accepts normal move '11-15'", () => {
    expect(createCheckersMove("11-15")).toBe("11-15");
  });

  it("accepts single-digit square moves '1-5'", () => {
    expect(createCheckersMove("1-5")).toBe("1-5");
  });

  it("accepts boundary moves (squares 1-32 for English checkers)", () => {
    expect(createCheckersMove("1-6")).toBe("1-6");
    expect(createCheckersMove("28-32")).toBe("28-32");
  });

  it("accepts jump move '11-18' (single capture)", () => {
    expect(createCheckersMove("11-18")).toBe("11-18");
  });

  it("accepts '(none)' (no-move indicator)", () => {
    expect(createCheckersMove("(none)")).toBe("(none)");
  });

  it("accepts moves with large square numbers (no upper bound in implementation)", () => {
    expect(createCheckersMove("100-200")).toBe("100-200");
  });
});

// ---------------------------------------------------------------------------
// createCheckersMove – invalid inputs
// ---------------------------------------------------------------------------
describe("createCheckersMove – invalid inputs", () => {
  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createCheckersMove("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createCheckersMove("   ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input (null)", () => {
    expect(() => createCheckersMove(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for slash notation '11/15' (must use '-')", () => {
    expect(() => createCheckersMove("11/15")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for letter notation 'abc'", () => {
    expect(() => createCheckersMove("abc")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for incomplete move '11-'", () => {
    expect(() => createCheckersMove("11-")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for missing dash '-15'", () => {
    expect(() => createCheckersMove("-15")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for '15' alone (no destination)", () => {
    expect(() => createCheckersMove("15")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for semicolon injection '11-15;stop'", () => {
    expect(() => createCheckersMove("11-15;stop")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for newline injection '11-15\\nstop'", () => {
    expect(() => createCheckersMove("11-15\nstop")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for null byte injection", () => {
    expect(() => createCheckersMove("11-15\0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for extra text after valid move '11-15 foo'", () => {
    expect(() => createCheckersMove("11-15 foo")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});

// ---------------------------------------------------------------------------
// createCheckersBoard – valid and invalid inputs
// ---------------------------------------------------------------------------
describe("createCheckersBoard", () => {
  it("accepts typical board string 'BWBWBWBWWBWBWBWB'", () => {
    expect(createCheckersBoard("BWBWBWBWWBWBWBWB")).toBe("BWBWBWBWWBWBWBWB");
  });

  it("accepts numeric position format '12345678901234567890123456789012'", () => {
    const pos = "1".repeat(32);
    expect(() => createCheckersBoard(pos)).not.toThrow();
  });

  it("accepts FEN-like format with forward slashes and dots", () => {
    expect(() => createCheckersBoard("B:WK1,K2:BK3,K4")).not.toThrow();
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createCheckersBoard("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createCheckersBoard("   ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string (number)", () => {
    expect(() => createCheckersBoard(42 as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string (null)", () => {
    expect(() => createCheckersBoard(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for newline injection", () => {
    expect(() => createCheckersBoard("BWBW\nstop")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.SECURITY_ERROR,
        i18nKey: "engine.errors.injectionDetected",
      }),
    );
  });

  it("throws SECURITY_ERROR for null byte injection", () => {
    expect(() => createCheckersBoard("BWBW\0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for carriage return injection", () => {
    expect(() => createCheckersBoard("BWBW\rstop")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });
});
