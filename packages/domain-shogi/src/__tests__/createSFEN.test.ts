import { describe, it, expect } from "vitest";
import { createSFEN } from "../index.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

describe("createSFEN verification", () => {
  it("should accept valid SFEN", () => {
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";
    expect(() => createSFEN(sfen)).not.toThrow();
  });

  it("should accept SFEN with hand pieces", () => {
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b 2P3p 1";
    expect(() => createSFEN(sfen)).not.toThrow();
  });

  it("should throw SECURITY_ERROR for illegal characters", () => {
    expect.assertions(3);
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1!";
    try {
      createSFEN(sfen);
    } catch (e) {
      expect(e).toBeInstanceOf(EngineError);
      if (e instanceof EngineError) {
        expect(e.code).toBe(EngineErrorCode.SECURITY_ERROR);
        expect(e.message).toContain("Illegal characters detected");
      }
    }
  });

  it("should throw VALIDATION_ERROR for invalid structure", () => {
    expect.assertions(3);
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b -";
    try {
      createSFEN(sfen);
    } catch (e) {
      expect(e).toBeInstanceOf(EngineError);
      if (e instanceof EngineError) {
        expect(e.code).toBe(EngineErrorCode.VALIDATION_ERROR);
        expect(e.message).toContain("Invalid SFEN structure");
      }
    }
  });

  it("should throw VALIDATION_ERROR for invalid move counter", () => {
    expect.assertions(3);
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 0";
    try {
      createSFEN(sfen);
    } catch (e) {
      expect(e).toBeInstanceOf(EngineError);
      if (e instanceof EngineError) {
        expect(e.code).toBe(EngineErrorCode.VALIDATION_ERROR);
        expect(e.message).toContain("Invalid SFEN move counter");
      }
    }
  });
});
