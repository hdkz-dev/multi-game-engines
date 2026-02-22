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
    expect.assertions(2);
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1!";
    try {
      createSFEN(sfen);
    } catch (e) {
      const err = e as EngineError;
      expect(err.code).toBe(EngineErrorCode.SECURITY_ERROR);
      expect(err.message).toContain("Illegal characters detected");
    }
  });

  it("should throw VALIDATION_ERROR for invalid structure", () => {
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b -";
    expect(() => createSFEN(sfen)).toThrow(EngineError);
    expect(() => createSFEN(sfen)).toThrow("Invalid SFEN structure");
  });

  it("should throw VALIDATION_ERROR for invalid move counter", () => {
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 0";
    expect(() => createSFEN(sfen)).toThrow(EngineError);
    expect(() => createSFEN(sfen)).toThrow("Invalid SFEN move counter");
  });
});
