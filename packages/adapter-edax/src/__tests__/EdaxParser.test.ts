import { describe, it, expect } from "vitest";
import { EdaxParser } from "../EdaxParser.js";

describe("EdaxParser", () => {
  const parser = new EdaxParser();

  it("should parse info message correctly", () => {
    // Edax info output example: "... depth 10 ..."
    const info = parser.parseInfo("Searching... depth 10 Mid: 0");
    expect(info).not.toBeNull();
    expect(info?.raw).toContain("depth 10");
    expect(info?.depth).toBe(10);
  });

  it("should parse result message correctly", () => {
    // Edax result output example: "move c4"
    const result = parser.parseResult("move c4");
    expect(result).not.toBeNull();
    expect(result?.bestMove).toBe("c4");
  });
});
