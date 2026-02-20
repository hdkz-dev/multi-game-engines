import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { KingsRowParser } from "../KingsRowParser.js";
import { createCheckersBoard } from "@multi-game-engines/domain-checkers";

beforeAll(() => {
  vi.spyOn(performance, "now").mockReturnValue(0);
});

afterAll(() => {
  vi.restoreAllMocks();
});

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

  it("should handle bestmove (none) correctly", () => {
    const parser = new KingsRowParser();
    const result = parser.parseResult("bestmove: (none)");
    expect(result?.bestMove).toBeNull();
  });

  it("should handle bestmove without eval correctly", () => {
    const parser = new KingsRowParser();
    const result = parser.parseResult("bestmove: 11-15");
    expect(result?.bestMove).toBe("11-15");
    expect(result?.eval).toBeUndefined();
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

  it("should throw on injection in createSearchCommand board data", () => {
    const parser = new KingsRowParser();
    expect(() =>
      parser.createSearchCommand({
        board: createCheckersBoard("11-15"),
        // Testing injection via custom field due to index signature
        "malicious\nkey": "data",
      }),
    ).toThrow(/Potential command injection/);
  });

  it("should reject injection in nested option values", () => {
    const parser = new KingsRowParser();
    // 制御文字を含む value
    expect(() => parser.createOptionCommand("Threads", "4\x00")).toThrow(
      /Potential command injection/,
    );
    expect(() => parser.createOptionCommand("Threads", "4\rstop")).toThrow(
      /Potential command injection/,
    );
  });
});
