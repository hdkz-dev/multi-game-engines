import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { EdaxParser } from "../EdaxParser.js";
import {
  ReversiBoard,
  createReversiBoard,
} from "@multi-game-engines/domain-reversi";

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
        board: "start\nquit" as unknown as ReversiBoard,
        depth: 10,
      }),
    ).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
  });

  it("should create valid option command", () => {
    expect(parser.createOptionCommand("level", 10)).toBe("set level 10");
  });

  it("should throw error for injection in option name or value", () => {
    expect(() => parser.createOptionCommand("level\nquit", 10)).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
    expect(() => parser.createOptionCommand("level", "10\nquit")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
  });

  it("should parse info with 'score' keyword and extract score value", () => {
    const info = parser.parseInfo("Edax score 12 depth 8");
    expect(info).not.toBeNull();
    expect(info?.score?.points).toBe(12);
  });

  it("should parse info with negative score", () => {
    const info = parser.parseInfo("depth 5 score -3");
    expect(info?.score?.points).toBe(-3);
  });

  it("should return null for non-string input", () => {
    expect(parser.parseInfo({ type: "info" })).toBeNull();
  });

  it("should return null for string with neither depth nor score", () => {
    expect(parser.parseInfo("searching position...")).toBeNull();
  });

  it("should handle 'move pass' (forced pass) returning bestMove null", () => {
    const result = parser.parseResult("move pass");
    expect(result).not.toBeNull();
    expect(result?.bestMove).toBeNull();
  });

  it("should handle 'move PASS' case-insensitively", () => {
    const result = parser.parseResult("move PASS");
    expect(result?.bestMove).toBeNull();
  });

  it("should handle invalid reversi move gracefully (catch block → bestMove null)", () => {
    const result = parser.parseResult("move ??invalid_move");
    expect(result).not.toBeNull();
    expect(result?.bestMove).toBeNull();
  });

  it("should return null for non-string input in parseResult", () => {
    expect(parser.parseResult({ type: "result" })).toBeNull();
  });

  it("should return null for string not starting with 'move '", () => {
    expect(parser.parseResult("info depth 10")).toBeNull();
  });

  it("should return null for 'move ' with empty move string", () => {
    expect(parser.parseResult("move ")).toBeNull();
  });

  it("should create valid search command with board and depth", () => {
    const commands = parser.createSearchCommand({
      board: createReversiBoard("start"),
      depth: 15,
    });
    expect(commands).toEqual(["setboard start", "go 15"]);
  });

  it("should use default depth 20 when depth not specified", () => {
    const commands = parser.createSearchCommand({
      board: createReversiBoard("start"),
    });
    expect(commands[1]).toBe("go 20");
  });

  it("should return 'stop' from createStopCommand", () => {
    expect(parser.createStopCommand()).toBe("stop");
  });
});
