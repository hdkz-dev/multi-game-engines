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
    let thrown: unknown;
    try {
      createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1; quit",
      );
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(EngineError);
    if (thrown instanceof EngineError) {
      expect(thrown.code).toBe(EngineErrorCode.SECURITY_ERROR);
    }
  });

  it("should throw VALIDATION_ERROR for too few fields", () => {
    let thrown: unknown;
    try {
      createSFEN("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b");
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(EngineError);
    if (thrown instanceof EngineError) {
      expect(thrown.code).toBe(EngineErrorCode.VALIDATION_ERROR);
      expect(thrown.message).toContain("Expected exactly 4 fields");
    }
  });
});
