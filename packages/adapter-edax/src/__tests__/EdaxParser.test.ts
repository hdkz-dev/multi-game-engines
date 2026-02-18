import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { EdaxParser } from "../EdaxParser.js";

describe("EdaxParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const parser = new EdaxParser();

  it("should parse info message correctly", () => {
    // Edax info output example: "... depth 10 ..."
    const info = parser.parseInfo("Searching... depth 10 Mid: 0");
    expect(info).not.toBeNull();
    expect(info?.raw).toContain("depth 10");
    expect(info?.depth).toBe(10);
  });

  it("should parse result message correctly", () => {
    // Edax result output example: "move c4"
    const result = parser.parseResult("move c4");
    expect(result).not.toBeNull();
    expect(result?.bestMove).toBe("c4");
  });

  it("should require a space after 'move' prefix", () => {
    expect(parser.parseResult("movec4")).toBeNull();
    expect(parser.parseResult("movement c4")).toBeNull();
  });

  it("should throw error for injection in board data", () => {
    expect(() =>
      parser.createSearchCommand({
        board:
          "start\nquit" as unknown as import("../EdaxParser.js").OthelloBoard,
        depth: 10,
      }),
    ).toThrow(/command injection/);
  });

  it("should create valid option command", () => {
    expect(parser.createOptionCommand("level", 10)).toBe("set level 10");
  });

  it("should throw error for injection in option name or value", () => {
    expect(() => parser.createOptionCommand("level\nquit", 10)).toThrow(
      /command injection/,
    );
    expect(() => parser.createOptionCommand("level", "10\nquit")).toThrow(
      /command injection/,
    );
  });
});
