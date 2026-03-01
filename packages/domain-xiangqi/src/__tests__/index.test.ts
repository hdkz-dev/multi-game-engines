import { describe, it, expect } from "vitest";
import { createXiangqiMove, createXFEN } from "../index.js";
import { EngineError } from "@multi-game-engines/core";

describe("Domain Xiangqi", () => {
  describe("createXiangqiMove", () => {
    it("should accept valid moves", () => {
      expect(createXiangqiMove("a0a1")).toBe("a0a1");
      expect(createXiangqiMove("h0g2")).toBe("h0g2");
      expect(createXiangqiMove("i9i8")).toBe("i9i8");
      expect(createXiangqiMove("resign")).toBe("resign");
    });

    it("should reject invalid formats", () => {
      expect(() => createXiangqiMove("a0a10")).toThrow(EngineError);
      expect(() => createXiangqiMove("j0a1")).toThrow(EngineError);
    });
  });

  describe("createXFEN", () => {
    it("should accept valid FEN", () => {
      const fen =
        "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";
      expect(createXFEN(fen)).toBe(fen);
    });
  });
});
