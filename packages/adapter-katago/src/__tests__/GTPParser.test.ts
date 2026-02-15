import { describe, it, expect } from "vitest";
import { GTPParser } from "../GTPParser.js";

describe("GTPParser", () => {
  const parser = new GTPParser();

  it("should parse info correctly", () => {
    const info = parser.parseInfo("info visits 100 winrate 0.55");
    expect(info).not.toBeNull();
    expect(info!.visits).toBe(100);
    expect(info!.winrate).toBe(0.55);
  });

  it("should parse visits only correctly", () => {
    const info = parser.parseInfo("info visits 100");
    expect(info).not.toBeNull();
    expect(info!.visits).toBe(100);
    expect(info!.winrate).toBeUndefined();
  });

  it("should parse winrate only correctly", () => {
    const info = parser.parseInfo("info winrate 0.55");
    expect(info).not.toBeNull();
    expect(info!.visits).toBeUndefined();
    expect(info!.winrate).toBe(0.55);
  });

  it("should parse result correctly", () => {
    const result = parser.parseResult("= D4");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("D4");
  });

  it("should parse result with ID correctly", () => {
    const result = parser.parseResult("=1 D4");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("D4");
  });

  it("should parse result with different ID correctly", () => {
    const result = parser.parseResult("=42 pass");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("pass");
  });

  it("should throw error for injection in board data", () => {
    expect(() =>
      parser.createSearchCommand({
        board: "A1\nquit" as unknown as import("../GTPParser.js").GOBoard,
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
