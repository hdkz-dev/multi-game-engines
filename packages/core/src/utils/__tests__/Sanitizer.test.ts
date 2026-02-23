import { describe, it, expect } from "vitest";
import { truncateLog } from "../Sanitizer.js";

describe("Sanitizer: truncateLog", () => {
  it("should not truncate strings shorter than maxLength", () => {
    expect(truncateLog("short", 10)).toBe("short");
  });

  it("should truncate strings longer than maxLength", () => {
    expect(truncateLog("a very long string", 5)).toBe("a ver...");
  });

  it("should handle objects by serializing to JSON", () => {
    const obj = { key: "value" };
    // JSON.stringify({ key: "value" }) is '{"key":"value"}' (15 chars)
    expect(truncateLog(obj, 10)).toBe('{"key":"va...');
  });

  it("should handle undefined and return placeholder", () => {
    expect(truncateLog(undefined)).toBe("[Unserializable Data]");
  });

  it("should handle functions and Symbols and return placeholder", () => {
    expect(truncateLog(() => {})).toBe("[Unserializable Data]");
    expect(truncateLog(Symbol("test"))).toBe("[Unserializable Data]");
  });

  it("should handle circular references gracefully", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj["self"] = obj;
    expect(truncateLog(obj)).toBe("[Unserializable Data]");
  });

  it("should use default maxLength of 20", () => {
    const longStr = "1234567890123456789012345";
    expect(truncateLog(longStr)).toBe("12345678901234567890...");
  });
});
