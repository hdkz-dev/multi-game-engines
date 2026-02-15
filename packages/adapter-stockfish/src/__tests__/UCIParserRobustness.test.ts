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

  it("should handle bestmove (none) correctly", () => {
    const line = "bestmove (none)";
    const result = parser.parseResult(line);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.bestMove).toBe("(none)");
    }
  });

  it("should skip invalid moves in PV", () => {
    const line = "info pv e2e4 invalid e7e5";
    const info = parser.parseInfo(line);
    expect(info).not.toBeNull();
    expect(info!.pv).toEqual(["e2e4", "e7e5"]);
  });

  it("should handle mate score conversion", () => {
    const line = "info score mate 5";
    const info = parser.parseInfo(line);
    expect(info).not.toBeNull();
    expect(info!.score).toBe(50000); // 5 * 10000
  });

  it("should return null for non-string inputs", () => {
    expect(
      parser.parseInfo(new Uint8Array([1, 2, 3]) as unknown as string),
    ).toBeNull();
    expect(parser.parseResult({} as unknown as string)).toBeNull();
  });

  it("should return null for invalid bestmove format", () => {
    expect(parser.parseResult("bestmove invalid_format")).toBeNull();
  });
});
