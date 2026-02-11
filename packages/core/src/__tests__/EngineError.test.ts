import { describe, it, expect } from "vitest";
import { EngineError } from "../errors/EngineError";
import { EngineErrorCode } from "../types";

describe("EngineError", () => {
  it("should create an error with correct properties", () => {
    const error = new EngineError(
      EngineErrorCode.WASM_INIT_FAILED,
      "Failed to init WASM",
      "stockfish"
    );
    
    expect(error.code).toBe(EngineErrorCode.WASM_INIT_FAILED);
    expect(error.engineId).toBe("stockfish");
    expect(error.message).toBe("Failed to init WASM");
  });

  it("should create from unknown error", () => {
    const original = new Error("Original error");
    const error = EngineError.from(original, "stockfish");
    
    expect(error.code).toBe(EngineErrorCode.UNKNOWN_ERROR);
    expect(error.originalError).toBe(original);
  });
});
