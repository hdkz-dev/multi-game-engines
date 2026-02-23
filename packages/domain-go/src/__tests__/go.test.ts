import { describe, it, expect } from "vitest";
import { createGOMove, createGOBoard } from "../index.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

describe("domain-go", () => {
  describe("createGOMove", () => {
    it("should validate valid moves", () => {
      expect(createGOMove("Q16")).toBe("q16");
      expect(createGOMove("pass")).toBe("pass");
    });

    it("should throw on invalid moves (Validation Error)", () => {
      // Invalid format
      try {
        createGOMove("Z99");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EngineError);
        if (err instanceof EngineError) {
          expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
          expect(err.message).toMatch(/Invalid GOMove format/);
        }
      }
    });

    it("should throw on injection (Security Error)", () => {
      // Control characters
      try {
        createGOMove("Q16\n");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EngineError);
        if (err instanceof EngineError) {
          expect(err.code).toBe(EngineErrorCode.SECURITY_ERROR);
          expect(err.message).toMatch(/Potential command injection/);
        }
      }
    });
  });

  describe("createGOBoard", () => {
    it("should allow valid strings", () => {
      expect(createGOBoard("board-data")).toBe("board-data");
    });

    it("should throw on empty input", () => {
      try {
        createGOBoard("");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EngineError);
        if (err instanceof EngineError) {
          expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
          expect(err.message).toMatch(/Invalid GOBoard/);
        }
      }
    });

    it("should throw on injection (Security Error)", () => {
      try {
        createGOBoard("board\nquit");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EngineError);
        if (err instanceof EngineError) {
          expect(err.code).toBe(EngineErrorCode.SECURITY_ERROR);
          expect(err.message).toMatch(/Potential command injection/);
        }
      }
    });
  });
});
