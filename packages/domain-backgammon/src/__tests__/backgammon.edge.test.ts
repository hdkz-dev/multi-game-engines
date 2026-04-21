/**
 * Backgammon – official rules edge case tests.
 *
 * Board: 26-element signed integer array
 *   index 0: white bar,  1-24: points (1=white home, 24=white starting)
 *   index 25: black bar
 *   positive = white pieces, negative = black pieces
 *
 * Move format (case-insensitive):
 *   (<from>/<to>)( <from>/<to>)*
 *   from: bar | \d+     to: off | \d+
 *   Multiple sub-moves space-separated (up to 4 dice rolls)
 *   Examples: "24/18", "bar/24", "6/off", "24/18 18/13", "6/1 6/1 6/1 6/1"
 */
import { describe, it, expect } from "vitest";
import { createBackgammonBoard, createBackgammonMove } from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

// ---------------------------------------------------------------------------
// createBackgammonBoard – edge cases
// ---------------------------------------------------------------------------
describe("createBackgammonBoard – edge cases", () => {
  it("accepts a standard starting position (positive = white, negative = black)", () => {
    const board = new Array(26).fill(0);
    board[1] = 2;
    board[12] = 5;
    board[17] = 3;
    board[19] = 5; // white
    board[24] = -2;
    board[13] = -5;
    board[8] = -3;
    board[6] = -5; // black
    expect(() => createBackgammonBoard(board)).not.toThrow();
  });

  it("accepts board with max-size values (15 pieces per side)", () => {
    const board = new Array(26).fill(0);
    board[1] = 15;
    board[24] = -15;
    expect(() => createBackgammonBoard(board)).not.toThrow();
  });

  // TODO: createBackgammonBoard currently uses isFinite (not isInteger), so
  // floating-point values pass. Consider tightening to Number.isInteger in a
  // follow-up to match the real game constraint (pieces are always whole numbers).
  it("currently accepts floating-point numbers (isFinite only — not isInteger)", () => {
    const board = new Array(26).fill(0);
    board[5] = 1.5;
    expect(() => createBackgammonBoard(board)).not.toThrow();
  });

  it("accepts negative-index-25 (black bar)", () => {
    const board = new Array(26).fill(0);
    board[25] = -2;
    expect(() => createBackgammonBoard(board)).not.toThrow();
  });

  it("throws for array of length 0", () => {
    expect(() => createBackgammonBoard([])).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
  });

  it("throws for array with mixed valid and invalid elements", () => {
    const board = [...new Array(25).fill(0), undefined];
    expect(() => createBackgammonBoard(board)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
  });

  it("throws for -Infinity element", () => {
    const board = new Array(26).fill(0);
    board[10] = -Infinity;
    expect(() => createBackgammonBoard(board)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
  });

  it("throws for object (not array)", () => {
    expect(() => createBackgammonBoard({ length: 26 })).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// createBackgammonMove – valid inputs
// ---------------------------------------------------------------------------
describe("createBackgammonMove – valid inputs", () => {
  it("single move: '24/18'", () => {
    expect(createBackgammonMove("24/18")).toBe("24/18");
  });

  it("two-move sequence: '24/18 18/13'", () => {
    expect(createBackgammonMove("24/18 18/13")).toBe("24/18 18/13");
  });

  it("three-move sequence: '6/3 6/3 6/3'", () => {
    expect(createBackgammonMove("6/3 6/3 6/3")).toBe("6/3 6/3 6/3");
  });

  it("four-move sequence (doubles): '6/1 6/1 6/1 6/1'", () => {
    expect(createBackgammonMove("6/1 6/1 6/1 6/1")).toBe("6/1 6/1 6/1 6/1");
  });

  it("bar entry: 'bar/24'", () => {
    expect(createBackgammonMove("bar/24")).toBe("bar/24");
  });

  it("bearing off: '6/off'", () => {
    expect(createBackgammonMove("6/off")).toBe("6/off");
  });

  it("bar entry then continue: 'bar/24 24/18'", () => {
    expect(createBackgammonMove("bar/24 24/18")).toBe("bar/24 24/18");
  });

  it("case-insensitive BAR and OFF: 'BAR/24', '6/OFF'", () => {
    expect(createBackgammonMove("BAR/24")).toBe("BAR/24");
    expect(createBackgammonMove("6/OFF")).toBe("6/OFF");
  });

  it("point '0/off' (valid per regex – no lower bound check)", () => {
    expect(createBackgammonMove("0/off")).toBe("0/off");
  });

  it("large point numbers (no upper bound check in implementation)", () => {
    expect(createBackgammonMove("100/off")).toBe("100/off");
  });
});

// ---------------------------------------------------------------------------
// createBackgammonMove – invalid inputs
// ---------------------------------------------------------------------------
describe("createBackgammonMove – invalid inputs", () => {
  it("throws for empty string", () => {
    expect(() => createBackgammonMove("")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("throws for whitespace-only string", () => {
    expect(() => createBackgammonMove("   ")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("throws for dash notation '24-18' (must use '/')", () => {
    expect(() => createBackgammonMove("24-18")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("throws for incomplete move '24/'", () => {
    expect(() => createBackgammonMove("24/")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("throws for missing slash '/off' (no from-point)", () => {
    expect(() => createBackgammonMove("/off")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("throws for leading space ' 24/18'", () => {
    expect(() => createBackgammonMove(" 24/18")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("throws for double space between sub-moves '24/18  18/13'", () => {
    expect(() => createBackgammonMove("24/18  18/13")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("throws SECURITY_ERROR for newline injection", () => {
    expect(() => createBackgammonMove("24/18\nquit")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.SECURITY_ERROR,
        i18nKey: "engine.errors.injectionDetected",
      }),
    );
  });

  it("throws SECURITY_ERROR for tab injection", () => {
    expect(() => createBackgammonMove("24/18\tquit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for null byte injection", () => {
    expect(() => createBackgammonMove("24/18\0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  // Semicolons are not in the control-character injection list ([\r\n\t\f\v\0]),
  // so they are rejected by the format regex with VALIDATION_ERROR rather than
  // SECURITY_ERROR. The input is still safely rejected before reaching any engine.
  it("throws VALIDATION_ERROR for semicolon in move '24/18; stop' (format rejection)", () => {
    expect(() => createBackgammonMove("24/18; stop")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("throws for non-string input (null)", () => {
    expect(() => createBackgammonMove(null as unknown as string)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });
});
