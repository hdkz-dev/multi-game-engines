import { describe, it, expect } from "vitest";
import { createBackgammonBoard, createBackgammonMove } from "../index.js";
import { EngineError } from "@multi-game-engines/core";

describe("createBackgammonBoard", () => {
  it("should create a valid 26-element board", () => {
    const board = new Array(26).fill(0);
    board[0] = 2;
    board[24] = -2;
    const result = createBackgammonBoard(board);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(26);
    expect(result[0]).toBe(2);
  });

  it("should accept a board of all zeros", () => {
    const board = new Array(26).fill(0);
    expect(() => createBackgammonBoard(board)).not.toThrow();
  });

  it("should throw for non-array input", () => {
    expect(() => createBackgammonBoard("not-an-array")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
    expect(() => createBackgammonBoard(null)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
    expect(() => createBackgammonBoard(42)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
  });

  it("should throw for wrong array length", () => {
    expect(() => createBackgammonBoard(new Array(25).fill(0))).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
    expect(() => createBackgammonBoard(new Array(27).fill(0))).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
    expect(() => createBackgammonBoard([])).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
  });

  it("should throw for non-number elements", () => {
    const board = new Array(26).fill(0);
    board[5] = "two";
    expect(() => createBackgammonBoard(board)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
  });

  it("should throw for non-finite numbers (NaN, Infinity)", () => {
    const nanBoard = new Array(26).fill(0);
    nanBoard[3] = NaN;
    expect(() => createBackgammonBoard(nanBoard)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );

    const infBoard = new Array(26).fill(0);
    infBoard[3] = Infinity;
    expect(() => createBackgammonBoard(infBoard)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonBoard",
      }),
    );
  });
});

describe("createBackgammonMove", () => {
  it("should create valid backgammon moves", () => {
    expect(createBackgammonMove("24/18")).toBe("24/18");
    expect(createBackgammonMove("24/18 18/13")).toBe("24/18 18/13");
  });

  it("should handle bar and off notation correctly", () => {
    expect(createBackgammonMove("bar/24")).toBe("bar/24");
    expect(createBackgammonMove("6/off")).toBe("6/off");
    expect(createBackgammonMove("bar/24 24/18")).toBe("bar/24 24/18");
  });

  it("should handle case-insensitive bar and off", () => {
    expect(createBackgammonMove("BAR/24")).toBe("BAR/24");
    expect(createBackgammonMove("6/OFF")).toBe("6/OFF");
  });

  it("should throw for empty or whitespace-only string", () => {
    expect(() => createBackgammonMove("")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
    expect(() => createBackgammonMove("   ")).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("should throw for non-string input", () => {
    expect(() => createBackgammonMove(null as unknown as string)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidBackgammonMove",
      }),
    );
  });

  it("should throw for invalid move formats", () => {
    try {
      createBackgammonMove("invalid");
    } catch (e) {
      if (e instanceof EngineError) {
        expect(e.i18nKey).toBe("engine.errors.invalidBackgammonMove");
      } else {
        throw e;
      }
    }
    expect(() => createBackgammonMove("24-18")).toThrow();
    expect(() => createBackgammonMove("24/")).toThrow();
  });

  it("should throw for control character injection", () => {
    expect(() => createBackgammonMove("24/18\nquit")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
    expect(() => createBackgammonMove("24/18\tquit")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
    expect(() => createBackgammonMove("24/18\0")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
    expect(() => createBackgammonMove("24/18\r")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
  });

  it("should throw for semicolon injection", () => {
    expect(() => createBackgammonMove("24/18; stop")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
  });
});
