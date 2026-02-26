import { describe, it, expect } from "vitest";
import { GNUBGParser } from "../GNUBGParser.js";
import { createBackgammonBoard } from "@multi-game-engines/domain-backgammon";

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

  it("should handle edge move values in parseResult", () => {
    const parser = new GNUBGParser();
    // Empty move or (none) handling
    const result1 = parser.parseResult({ type: "bestmove", move: "" });
    expect(result1?.bestMove).toBeNull();
    const result2 = parser.parseResult({ type: "bestmove", move: "(none)" });
    expect(result2?.bestMove).toBeNull();
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

  it("should throw on injection in createOptionCommand", () => {
    const parser = new GNUBGParser();
    expect(() => parser.createOptionCommand("Threads\nquit", 2)).toThrow(
      /Potential command injection/,
    );
    expect(() => parser.createOptionCommand("Threads", "2\0")).toThrow(
      /Potential command injection/,
    );
  });

  it("should create valid search commands", () => {
    const parser = new GNUBGParser();
    // Use factory or proper casting if available
    const board = createBackgammonBoard(Array(26).fill(0));
    const commands = parser.createSearchCommand({
      board,
      dice: [6, 5],
    });
    expect(commands).toContain(
      "set board 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0",
    );
    expect(commands).toContain("set dice 6 5");
    expect(commands).toContain("analyze");
  });

  it("should throw error for injection in custom fields (index signature)", () => {
    const parser = new GNUBGParser();
    expect(() =>
      parser.createSearchCommand({
        board: createBackgammonBoard(Array(26).fill(0)),
        dice: [6, 5],
        "malicious\nkey": "value",
      }),
    ).toThrow(expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }));
  });
});
