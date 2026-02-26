import { describe, it, expect } from "vitest";
import { createMahjongMove, validateMahjongBoard } from "../index.js";

describe("domain-mahjong", () => {
  describe("createMahjongMove", () => {
    it("should validate valid moves", () => {
      expect(createMahjongMove("1m")).toBe("1m");
      expect(createMahjongMove("7z")).toBe("7z");
      expect(createMahjongMove("tsumo")).toBe("tsumo");
    });

    it("should throw on invalid moves", () => {
      expect(() => createMahjongMove("invalid")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.invalidMahjongMove" }),
      );
      expect(() => createMahjongMove("10m")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.invalidMahjongMove" }),
      );
    });
  });

  describe("validateMahjongBoard", () => {
    it("should allow valid objects", () => {
      expect(() => validateMahjongBoard({ hand: ["1m"] })).not.toThrow();
    });

    it("should throw on injection", () => {
      expect(() => validateMahjongBoard({ hand: ["1m\nquit"] })).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });
  });
});
