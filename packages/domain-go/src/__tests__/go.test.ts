import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createGOMove, createGOBoard } from "../index.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

beforeEach(() => {
  vi.spyOn(performance, "now").mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("domain-go", () => {
  describe("createGOMove", () => {
    it("should validate valid moves", () => {
      expect(createGOMove("Q16")).toBe("q16");
      expect(createGOMove("pass")).toBe("pass");
    });

    it("should throw on invalid moves (Validation Error)", () => {
      expect.assertions(3);
      // Invalid format
      try {
        createGOMove("Z99");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EngineError);
        if (err instanceof EngineError) {
          expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
          expect(err.i18nKey).toBe("engine.errors.invalidGOMove");
        }
      }
    });

    it("should throw on empty string (Validation Error)", () => {
      expect.assertions(3);
      try {
        createGOMove("");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EngineError);
        if (err instanceof EngineError) {
          expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
          expect(err.i18nKey).toBe("engine.errors.invalidGOMove");
        }
      }
    });

    it("should throw on injection (Security Error)", () => {
      expect.assertions(3);
      // Control characters
      try {
        createGOMove("Q16\n");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EngineError);
        if (err instanceof EngineError) {
          expect(err.code).toBe(EngineErrorCode.SECURITY_ERROR);
          expect(err.i18nKey).toBe("engine.errors.illegalCharacters");
        }
      }
    });
  });

  describe("createGOBoard", () => {
    it("should allow valid strings", () => {
      expect(createGOBoard("board-data")).toBe("board-data");
    });

    it("should throw on empty input", () => {
      expect.assertions(3);
      try {
        createGOBoard("");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EngineError);
        if (err instanceof EngineError) {
          expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
          expect(err.i18nKey).toBe("engine.errors.invalidGOBoard");
        }
      }
    });

    it("should throw on injection (Security Error)", () => {
      expect.assertions(3);
      try {
        createGOBoard("board\nquit");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EngineError);
        if (err instanceof EngineError) {
          expect(err.code).toBe(EngineErrorCode.SECURITY_ERROR);
          expect(err.i18nKey).toBe("engine.errors.illegalCharacters");
        }
      }
    });
  });
});
