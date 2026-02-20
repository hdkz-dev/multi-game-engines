import { describe, it, expect } from "vitest";
import { KingsRowParser } from "../KingsRowParser.js";

describe("KingsRowParser", () => {
  it("should parse info strings correctly", () => {
    const parser = new KingsRowParser();
    const info = parser.parseInfo("eval: 0.12, depth: 10, pv: 11-15 22-18");
    expect(info).not.toBeNull();
    expect(info?.eval).toBe(0.12);
    expect(info?.depth).toBe(10);
  });

  it("should parse bestmove results correctly", () => {
    const parser = new KingsRowParser();
    const result = parser.parseResult("bestmove: 11-15 (eval: 0.12)");
    expect(result).not.toBeNull();
    expect(result?.bestMove).toBe("11-15");
    expect(result?.eval).toBe(0.12);
  });

  it("should return null for malformed strings", () => {
    const parser = new KingsRowParser();
    expect(parser.parseInfo("invalid")).toBeNull();
    expect(parser.parseResult("not a move")).toBeNull();
  });

  it("should create valid commands", () => {
    const parser = new KingsRowParser();
    expect(parser.createStopCommand()).toBe("stop");
    expect(parser.createOptionCommand("Threads", 4)).toBe("set Threads 4");
  });

  it("should throw on injection in options", () => {
    const parser = new KingsRowParser();
    expect(() => parser.createOptionCommand("name", "val\nstop")).toThrow();
  });
});
