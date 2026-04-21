import { describe, it, expect } from "vitest";
import { createCheckersBoard, createCheckersMove } from "../index.js";

describe("Checkers Domain", () => {
  describe("createCheckersBoard", () => {
    it("should create a valid board from a position string", () => {
      const board = createCheckersBoard("BWBWBWBW");
      expect(board).toBe("BWBWBWBW");
    });

    it("should throw on empty string", () => {
      expect(() => createCheckersBoard("")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidCheckersBoard",
        }),
      );
    });

    it("should throw on whitespace-only string", () => {
      expect(() => createCheckersBoard("   ")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidCheckersBoard",
        }),
      );
    });

    it("should throw on non-string input", () => {
      expect(() => createCheckersBoard(null as unknown as string)).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidCheckersBoard",
        }),
      );
      expect(() => createCheckersBoard(123 as unknown as string)).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidCheckersBoard",
        }),
      );
    });

    it("should throw on injection attack in board string", () => {
      expect(() => createCheckersBoard("BWBW\nstop")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });
  });

  describe("createCheckersMove", () => {
    it("should validate move format", () => {
      const move = createCheckersMove("11-15");
      expect(move).toBe("11-15");
    });

    it("should accept (none) as a valid move", () => {
      const move = createCheckersMove("(none)");
      expect(move).toBe("(none)");
    });

    it("should accept multi-capture moves", () => {
      expect(createCheckersMove("1-10")).toBe("1-10");
      expect(createCheckersMove("22-31")).toBe("22-31");
    });

    it("should throw on empty string", () => {
      expect(() => createCheckersMove("")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidCheckersMove",
        }),
      );
    });

    it("should throw on whitespace-only string", () => {
      expect(() => createCheckersMove("   ")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidCheckersMove",
        }),
      );
    });

    it("should throw on non-string input", () => {
      expect(() => createCheckersMove(null as unknown as string)).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidCheckersMove",
        }),
      );
    });

    it("should throw on invalid move format", () => {
      expect(() => createCheckersMove("abc")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidCheckersMove",
        }),
      );
      expect(() => createCheckersMove("11/15")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidCheckersMove",
        }),
      );
    });

    it("should throw on injection characters", () => {
      expect(() => createCheckersMove("11-15;stop")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });
  });
});
