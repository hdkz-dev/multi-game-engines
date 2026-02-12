import { describe, it, expect } from "vitest";
import { EngineError } from "../errors/EngineError";
import { EngineErrorCode } from "../types";

describe("EngineError", () => {
  it("should create an error with correct properties and name", () => {
    const error = new EngineError(
      EngineErrorCode.INTERNAL_ERROR,
      "Failed to init WASM",
      "stockfish"
    );
    
    expect(error.code).toBe(EngineErrorCode.INTERNAL_ERROR);
    expect(error.engineId).toBe("stockfish");
    expect(error.message).toBe("Failed to init WASM");
    expect(error.name).toBe("EngineError");
  });

  it("should return the same instance if already an EngineError", () => {
    const original = new EngineError(EngineErrorCode.NETWORK_ERROR, "fail");
    const result = EngineError.from(original);
    expect(result).toBe(original);
  });

  it("should wrap regular Error into EngineError", () => {
    const original = new Error("Regular fail");
    const error = EngineError.from(original, "test-id");
    
    expect(error.code).toBe(EngineErrorCode.UNKNOWN_ERROR);
    expect(error.message).toBe("Regular fail");
    expect(error.engineId).toBe("test-id");
    expect(error.originalError).toBe(original);
  });

  it("should handle string input in from()", () => {
    const error = EngineError.from("string error");
    expect(error.message).toBe("string error");
    expect(error.code).toBe(EngineErrorCode.UNKNOWN_ERROR);
  });
});
