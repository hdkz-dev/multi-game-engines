import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { GTPParser } from "../GTPParser.js";
import { GOBoard } from "@multi-game-engines/domain-go";

describe("GTPParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const parser = new GTPParser();

  it("should parse info from object correctly", () => {
    const info = parser.parseInfo({ visits: 100, winrate: 0.55 });
    expect(info).not.toBeNull();
    expect(info!.visits).toBe(100);
    expect(info!.winrate).toBe(0.55);
  });

  it("should parse KataGo JSON info correctly", () => {
    const data = {
      visits: 100,
      winrate: 0.55,
      scoreLead: 2.5,
      pv: ["D4", "Q16"],
    };
    const info = parser.parseInfo(data);
    expect(info).not.toBeNull();
    expect(info!.visits).toBe(100);
    expect(info!.winrate).toBe(0.55);
    expect(info!.scoreLead).toBe(2.5);
    expect(info!.pv).toEqual(["d4", "q16"]); // Normalized to lowercase
  });

  it("should handle non-string PV entries gracefully in KataGo JSON", () => {
    const data = {
      visits: 50,
      pv: ["D4", 123, null, "Q16"],
    };
    const info = parser.parseInfo(data as Record<string, unknown>);
    expect(info!.pv).toEqual(["d4", "q16"]);
  });

  it("should return null for non-info strings", () => {
    expect(parser.parseInfo("random text")).toBeNull();
    expect(parser.parseInfo("")).toBeNull();
  });

  it("should parse result correctly and normalize to lowercase", () => {
    const result = parser.parseResult("= D4");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("d4");
  });

  it("should parse result with ID correctly", () => {
    const result = parser.parseResult("=1 D4");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("d4");
  });

  it("should parse result with different ID correctly", () => {
    const result = parser.parseResult("=42 pass");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("pass");
  });

  it("should validate move coordinates edge cases", () => {
    // Valid cases (up to row 25 in 2026 Zenith Tier)
    expect(parser.parseResult("= T19")).not.toBeNull();
    expect(parser.parseResult("= A1")).not.toBeNull();
    expect(parser.parseResult("= A20")).not.toBeNull();
    expect(parser.parseResult("= Z25")).not.toBeNull();
    expect(parser.parseResult("= pass")).not.toBeNull();
    expect(parser.parseResult("= resign")).not.toBeNull();

    // Invalid cases (Should throw EngineError in 2026 Zenith Tier)
    expect(() => parser.parseResult("= I1")).toThrow();
    expect(() => parser.parseResult("= A0")).toThrow();
    expect(() => parser.parseResult("= A26")).toThrow();
    expect(() => parser.parseResult("= @1")).toThrow();
  });

  it("should throw error for injection in board data", () => {
    expect(() =>
      parser.createSearchCommand({
        board: "A1\nquit" as unknown as GOBoard,
        color: "black",
      }),
    ).toThrow(/command injection/);
  });

  it("should create valid option command", () => {
    expect(parser.createOptionCommand("analysis_threads", 4)).toBe(
      "set_option analysis_threads 4",
    );
  });

  it("should throw error for injection in option name or value", () => {
    expect(() =>
      parser.createOptionCommand("analysis_threads\nquit", 4),
    ).toThrow(/command injection/);
    expect(() =>
      parser.createOptionCommand("analysis_threads", "4\nquit"),
    ).toThrow(/command injection/);
  });
});
