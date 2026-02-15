import { describe, it, expect } from "vitest";
import { USIParser } from "../USIParser.js";
import { SFEN } from "../usi-types.js";

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

  it("should reject non-standard fullwidth asterisk in bestmove", () => {
    const result = parser.parseResult("bestmove 7g7f＊");
    expect(result).toBeNull();
  });

  it("should throw error for injection in SFEN", () => {
    expect(() =>
      parser.createSearchCommand({
        sfen: "startpos\nquit" as SFEN,
        depth: 10,
      }),
    ).toThrow(/command injection/);
  });

  it("should create valid option command", () => {
    expect(parser.createOptionCommand("USI_Hash", 256)).toBe(
      "setoption name USI_Hash value 256",
    );
  });

  it("should throw error for injection in option name or value", () => {
    expect(() => parser.createOptionCommand("USI_Hash\nquit", 256)).toThrow(
      /command injection/,
    );
    expect(() => parser.createOptionCommand("USI_Hash", "256\nquit")).toThrow(
      /command injection/,
    );
  });
});
