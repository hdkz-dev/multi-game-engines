import { describe, it, expect } from "vitest";
import { UCIParser } from "../UCIParser.js";

describe("UCIParser Robustness", () => {
  const parser = new UCIParser();

  it("should parse info with tokens after pv", () => {
    const line = "info depth 10 pv e2e4 e7e5 score cp 20 nps 1000";
    const info = parser.parseInfo(line);
    expect(info).not.toBeNull();
    if (info) {
      expect(info.depth).toBe(10);
      expect(info.pv).toEqual(["e2e4", "e7e5"]);
      expect(info.score).toBe(20);
      expect(info.nps).toBe(1000);
    }
  });
});
