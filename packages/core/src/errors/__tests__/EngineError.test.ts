import { describe, it, expect } from "vitest";
import { EngineError } from "../EngineError.js";
import { EngineErrorCode } from "../../types.js";

describe("EngineError", () => {
  it("should create an error with code and message", () => {
    const error = new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Test error",
    });
    expect(error.code).toBe(EngineErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("EngineError");
  });

  it("should return the same instance when passed to from()", () => {
    const original = new EngineError({
      code: EngineErrorCode.INTERNAL_ERROR,
      message: "Init failed",
      engineId: "stockfish",
    });
    const result = EngineError.from(original, "other");
    expect(result).toBe(original);
    expect(result.engineId).toBe("stockfish"); // SHOULD NOT be overwritten
  });

  it("should handle non-Error values in from()", () => {
    const error = EngineError.from("primitive error string");
    expect(error.message).toBe("primitive error string");
    expect(error.code).toBe(EngineErrorCode.UNKNOWN_ERROR);
  });

  it("should capture stack trace safe in V8 environments", () => {
    const error = new EngineError("Test");
    expect(error.stack).toBeDefined();
  });
});
