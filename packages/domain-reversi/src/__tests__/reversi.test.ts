import { describe, it, expect } from "vitest";
import { createReversiMove, createReversiBoard } from "../index.js";

describe("domain-reversi", () => {
  describe("createReversiMove", () => {
    it("should validate valid moves", () => {
      expect(createReversiMove("e4")).toBe("e4");
      expect(createReversiMove("c3")).toBe("c3");
      expect(createReversiMove("PS")).toBe("PS");
    });

    it("should throw on invalid moves", () => {
      expect(() => createReversiMove("z9")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.invalidReversiMove" }),
      );
      expect(() => createReversiMove("e4\n")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });
  });

  describe("createReversiBoard", () => {
    it("should allow valid strings", () => {
      expect(createReversiBoard("some-board-data")).toBe("some-board-data");
    });

    it("should throw on injection", () => {
      expect(() => createReversiBoard("board\nquit")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });
  });
});
