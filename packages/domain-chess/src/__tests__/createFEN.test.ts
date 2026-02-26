import { describe, it, expect } from "vitest";
import { createFEN } from "../index.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

describe("createFEN verification", () => {
  it("should accept valid FEN with en passant target", () => {
    // en passant target square is 'e3'
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    expect(() => createFEN(fen)).not.toThrow();
  });

  it("should throw SECURITY_ERROR for illegal characters", () => {
    expect.assertions(3);
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1!";
    try {
      createFEN(fen);
    } catch (e) {
      expect(e).toBeInstanceOf(EngineError);
      if (e instanceof EngineError) {
        expect(e.code).toBe(EngineErrorCode.SECURITY_ERROR);
        expect(e.i18nKey).toBe("engine.errors.illegalCharacters");
      }
    }
  });

  it("should throw VALIDATION_ERROR for invalid halfmove clock (non-integer)", () => {
    expect.assertions(3);
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1a 1";
    try {
      createFEN(fen);
    } catch (e) {
      expect(e).toBeInstanceOf(EngineError);
      if (e instanceof EngineError) {
        expect(e.code).toBe(EngineErrorCode.VALIDATION_ERROR);
        expect(e.i18nKey).toBe("engine.errors.invalidFENHalfmove");
      }
    }
  });

  it("should throw VALIDATION_ERROR for invalid fullmove number (less than 1)", () => {
    expect.assertions(3);
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";
    try {
      createFEN(fen);
    } catch (e) {
      expect(e).toBeInstanceOf(EngineError);
      if (e instanceof EngineError) {
        expect(e.code).toBe(EngineErrorCode.VALIDATION_ERROR);
        expect(e.i18nKey).toBe("engine.errors.invalidFENFullmove");
      }
    }
  });
});
