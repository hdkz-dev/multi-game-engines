import { describe, it, expect } from "vitest";
import { GNUBGParser } from "../GNUBGParser.js";

describe("GNUBGParser", () => {
  it("should parse info objects correctly", () => {
    const parser = new GNUBGParser();
    const info = parser.parseInfo({
      type: "info",
      equity: 0.05,
      winProb: 0.55,
    });
    expect(info).not.toBeNull();
    expect(info?.equity).toBe(0.05);
    expect(info?.winProbability).toBe(0.55);
  });

  it("should parse bestmove results correctly", () => {
    const parser = new GNUBGParser();
    const result = parser.parseResult({
      type: "bestmove",
      move: "24/18 18/13",
      equity: 0.05,
    });
    expect(result).not.toBeNull();
    expect(result?.bestMove).toBe("24/18 18/13");
    expect(result?.equity).toBe(0.05);
  });

  it("should handle invalid inputs gracefully", () => {
    const parser = new GNUBGParser();
    expect(parser.parseInfo("invalid")).toBeNull();
    expect(parser.parseResult("")).toBeNull();
  });

  it("should create valid commands", () => {
    const parser = new GNUBGParser();
    expect(parser.createStopCommand()).toBe("stop");
    expect(parser.createOptionCommand("Threads", 2)).toBe("set Threads 2");
  });
});
