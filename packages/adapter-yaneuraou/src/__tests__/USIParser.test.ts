import { describe, it, expect } from "vitest";
import { USIParser } from "../USIParser.js";

describe("USIParser", () => {
  const parser = new USIParser();

  it("should parse info correctly", () => {
    const info = parser.parseInfo("info depth 10 score cp 100");
    expect(info?.raw).toBeDefined();
  });

  it("should parse bestmove correctly", () => {
    const result = parser.parseResult("bestmove 7g7f");
    expect(result?.bestMove).toBe("7g7f");
  });
});
