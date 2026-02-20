import { describe, it, expect } from "vitest";
import { createFEN } from "../index.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

describe("createFEN verification", () => {
  it("should accept valid FEN with en passant target", () => {
    // en passant target square is 'e3'
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    expect(() => createFEN(fen)).not.toThrow();
  });

  it("should throw VALIDATION_ERROR for illegal characters", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1!";
    try {
      createFEN(fen);
    } catch (e) {
      const err = e as EngineError;
      expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
      expect(err.message).toContain("Illegal characters detected");
    }
  });

  it("should throw VALIDATION_ERROR for invalid halfmove clock (non-integer)", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1a 1";
    try {
      createFEN(fen);
    } catch (e) {
      const err = e as EngineError;
      expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
      expect(err.message).toContain("Invalid FEN halfmove clock");
    }
  });

  it("should throw VALIDATION_ERROR for invalid fullmove number (less than 1)", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";
    try {
      createFEN(fen);
    } catch (e) {
      const err = e as EngineError;
      expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
      expect(err.message).toContain("Invalid FEN fullmove number");
    }
  });
});
