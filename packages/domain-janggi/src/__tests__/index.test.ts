import { describe, it, expect } from "vitest";
import { createJanggiMove, createJanggiPosition } from "../index.js";
import { EngineError } from "@multi-game-engines/core";

describe("Domain Janggi", () => {
  describe("createJanggiMove", () => {
    it("should accept valid moves", () => {
      expect(createJanggiMove("a0a1")).toBe("a0a1");
      expect(createJanggiMove("pass")).toBe("pass");
    });

    it("should reject invalid moves", () => {
      expect(() => createJanggiMove("invalid")).toThrow(EngineError);
    });
  });

  describe("createJanggiPosition", () => {
    it("should accept valid positions", () => {
      expect(createJanggiPosition("startpos")).toBe("startpos");
    });
  });
});
