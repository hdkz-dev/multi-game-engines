import { describe, it, expect } from "vitest";
import { UCIParser } from "../UCIParser.js";

describe("UCIParser", () => {
  const parser = new UCIParser();

  it("should parse info depth correctly", () => {
    const info = parser.parseInfo("info depth 20");
    expect(info?.raw).toBe("info depth 20");
  });

  it("should parse bestmove correctly", () => {
    const result = parser.parseResult("bestmove e2e4");
    expect(result?.raw).toBe("bestmove e2e4");
  });
});
