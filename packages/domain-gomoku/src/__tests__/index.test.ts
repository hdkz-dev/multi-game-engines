import { describe, it, expect } from "vitest";
import { createGomokuMove, createGomokuPositionString } from "../index.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

describe("Domain Gomoku", () => {
  describe("createGomokuMove", () => {
    it("should accept valid moves", () => {
      expect(createGomokuMove("h8")).toBe("h8");
      expect(createGomokuMove("a1")).toBe("a1");
      expect(createGomokuMove("o15")).toBe("o15");
      expect(createGomokuMove("resign")).toBe("resign");
      expect(createGomokuMove("pass")).toBe("pass");
    });

    it("should reject invalid formats", () => {
      expect(() => createGomokuMove("")).toThrow(EngineError);
      expect(() => createGomokuMove("11")).toThrow(EngineError);
      expect(() => createGomokuMove("a")).toThrow(EngineError);
      expect(() => createGomokuMove("h8\\nquit")).toThrow(EngineError);

      try {
        createGomokuMove("invalid");
      } catch (e) {
        expect(e instanceof EngineError).toBe(true);
        expect((e as EngineError).code).toBe(EngineErrorCode.VALIDATION_ERROR);
      }
    });
  });

  describe("createGomokuPositionString", () => {
    it("should accept valid positions", () => {
      const pos = "15x15"; // dummy format
      expect(createGomokuPositionString(pos)).toBe(pos);
    });

    it("should reject empty strings", () => {
      expect(() => createGomokuPositionString("   ")).toThrow(EngineError);
    });

    it("should reject injected strings", () => {
      expect(() => createGomokuPositionString("pos\nquit")).toThrow(
        EngineError,
      );
    });
  });
});
