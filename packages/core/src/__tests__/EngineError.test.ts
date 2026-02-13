import { describe, it, expect } from "vitest";
import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode } from "../types.js";

describe("EngineError", () => {
  it("should create an error with correct properties and name", () => {
    const error = new EngineError({
      code: EngineErrorCode.NETWORK_ERROR,
      message: "test message",
      engineId: "test-engine",
    });

    expect(error.message).toBe("test message");
    expect(error.code).toBe(EngineErrorCode.NETWORK_ERROR);
    expect(error.engineId).toBe("test-engine");
    expect(error.name).toBe("EngineError");
  });

  it("should wrap an existing error using from()", () => {
    const original = new Error("original error");
    const wrapped = EngineError.from(original, "test-engine");

    expect(wrapped.message).toBe("original error");
    expect(wrapped.engineId).toBe("test-engine");
    expect(wrapped.originalError).toBe(original);
  });

  it("should return the same error if already an EngineError", () => {
    const error = new EngineError({
      code: EngineErrorCode.INTERNAL_ERROR,
      message: "test",
    });
    const result = EngineError.from(error);
    expect(result).toBe(error);
  });

  it("should capture stack trace if supported", () => {
    const error = new EngineError({
      code: EngineErrorCode.UNKNOWN_ERROR,
      message: "test",
    });
    expect(error.stack).toBeDefined();
  });

  it("should set remediation when provided", () => {
    const error = new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "test",
      remediation: "Fix COOP/COEP headers",
    });
    expect(error.remediation).toBe("Fix COOP/COEP headers");
  });

  it("should set remediation for SecurityError via from()", () => {
    const secErr = new Error("blocked");
    secErr.name = "SecurityError";
    const wrapped = EngineError.from(secErr);
    expect(wrapped.code).toBe(EngineErrorCode.SECURITY_ERROR);
    expect(wrapped.remediation).toBeDefined();
  });
});
