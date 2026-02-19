import { describe, it, expect } from "vitest";
import { createSFEN } from "./index.js";
import { EngineErrorCode } from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";

describe("createSFEN", () => {
  it("should accept a valid standard SFEN", () => {
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";
    expect(createSFEN(sfen)).toBe(sfen);
  });

  it("should accept SFEN with move count >= 10", () => {
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 10";
    expect(createSFEN(sfen)).toBe(sfen);
  });

  it("should throw EngineError for empty string", () => {
    expect(() => createSFEN("")).toThrow();
  });

  it("should throw SECURITY_ERROR for illegal characters", () => {
    try {
      createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1; quit",
      );
      throw new Error("Should have thrown");
    } catch (e) {
      const err = e as EngineError;
      expect(err.code).toBe(EngineErrorCode.SECURITY_ERROR);
    }
  });

  it("should throw VALIDATION_ERROR for too few fields", () => {
    try {
      createSFEN("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b");
      throw new Error("Should have thrown");
    } catch (e) {
      const err = e as EngineError;
      expect(err.code).toBe(EngineErrorCode.VALIDATION_ERROR);
      expect(err.message).toContain("Expected 4 fields");
    }
  });
});
