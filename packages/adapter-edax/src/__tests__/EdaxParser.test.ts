import { describe, it, expect } from "vitest";
import { EdaxParser } from "../EdaxParser.js";

describe("EdaxParser", () => {
  const parser = new EdaxParser();

  it("should parse info message correctly", () => {
    const info = parser.parseInfo("Depth: 10 Mid: 0");
    expect(info).toBeDefined();
    expect(info?.raw).toContain("Depth: 10");
  });

  it("should parse result message correctly", () => {
    const result = parser.parseResult("c4");
    expect(result).toBeDefined();
    expect(result?.bestMove).toBe("c4");
  });
});
