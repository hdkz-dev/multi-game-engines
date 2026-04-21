import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { MahjongJSONParser } from "../MahjongJSONParser.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

describe("MahjongJSONParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const parser = new MahjongJSONParser();

  it("should parse JSON info correctly", () => {
    const input = { type: "info", thinking: "some data" };
    const info = parser.parseInfo(input);
    expect(info).toEqual({
      raw: JSON.stringify(input),
      thinking: "some data",
    });
  });

  it("should parse string info correctly", () => {
    const input = JSON.stringify({ type: "info", thinking: "some data" });
    const info = parser.parseInfo(input);
    expect(info).toEqual({
      raw: input,
      thinking: "some data",
    });
  });

  it("should parse JSON result correctly", () => {
    const input = { type: "result", bestMove: "7z" };
    const result = parser.parseResult(input);
    expect(result).toEqual({
      raw: JSON.stringify(input),
      bestMove: "7z",
    });
  });

  it("should create valid search command", () => {
    const options = { board: { hand: ["1m", "2m"], dora: "1z" } };
    const command = parser.createSearchCommand(options);
    expect(command).toEqual({
      type: "search",
      board: options.board,
    });
  });

  it("should detect injection in top-level string", () => {
    expect.assertions(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = { board: "bad\ninput" } as any;
    let thrown: unknown;
    try {
      parser.createSearchCommand(options);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(EngineError);
    if (thrown instanceof EngineError) {
      expect(thrown.code).toBe(EngineErrorCode.SECURITY_ERROR);
    }
  });

  it("should detect injection in nested object", () => {
    expect.assertions(2);
    const options = { board: { hand: ["1m", "bad\rinput"] } };
    let thrown: unknown;
    try {
      parser.createSearchCommand(options);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(EngineError);
    if (thrown instanceof EngineError) {
      expect(thrown.code).toBe(EngineErrorCode.SECURITY_ERROR);
    }
  });

  it("should detect injection in deep nested object", () => {
    expect.assertions(2);
    const options = {
      board: { players: [{ name: "p1", history: ["good", "bad\0"] }] },
    };
    let thrown: unknown;
    try {
      parser.createSearchCommand(options);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(EngineError);
    if (thrown instanceof EngineError) {
      expect(thrown.code).toBe(EngineErrorCode.SECURITY_ERROR);
    }
  });

  describe("parseResult() edge cases", () => {
    it("should return { bestMove: null } when bestMove is null", () => {
      const result = parser.parseResult({ type: "result", bestMove: null });
      expect(result).not.toBeNull();
      expect(result!.bestMove).toBeNull();
    });

    it("should return { bestMove: null } when bestMove is undefined", () => {
      const result = parser.parseResult({
        type: "result",
        bestMove: undefined,
      });
      expect(result).not.toBeNull();
      expect(result!.bestMove).toBeNull();
    });

    it("should return null when bestMove is a number", () => {
      const result = parser.parseResult({ type: "result", bestMove: 42 });
      expect(result).toBeNull();
    });

    it("should return null when bestMove is a boolean", () => {
      const result = parser.parseResult({ type: "result", bestMove: true });
      expect(result).toBeNull();
    });

    it("should return null when bestMove is an object", () => {
      const result = parser.parseResult({
        type: "result",
        bestMove: { tile: "7z" },
      });
      expect(result).toBeNull();
    });

    it("should return null when type is not 'result'", () => {
      expect(parser.parseResult({ type: "info", bestMove: "7z" })).toBeNull();
    });

    it("should return null for non-object data (string with wrong type)", () => {
      const result = parser.parseResult(
        JSON.stringify({ type: "info", bestMove: "7z" }),
      );
      expect(result).toBeNull();
    });

    it("should return null for invalid JSON string", () => {
      const result = parser.parseResult("not valid json{{{");
      expect(result).toBeNull();
    });

    it("should return null for array data", () => {
      const result = parser.parseResult("[]");
      expect(result).toBeNull();
    });
  });

  describe("parseInfo() edge cases", () => {
    it("should return null for array input", () => {
      expect(parser.parseInfo("[]")).toBeNull();
    });

    it("should return null for invalid JSON string", () => {
      expect(parser.parseInfo("{invalid json")).toBeNull();
    });

    it("should return null when type is not 'info'", () => {
      expect(parser.parseInfo({ type: "result", thinking: "foo" })).toBeNull();
    });

    it("should parse info with evaluations containing non-string move (filtered out)", () => {
      const input = {
        type: "info",
        thinking: "ok",
        evaluations: [
          { move: 42, ev: 0.5 }, // number move — filtered
          { move: "7z", ev: 0.8 }, // valid
        ],
      };
      const info = parser.parseInfo(input);
      expect(info).not.toBeNull();
      expect(info!.evaluations).toHaveLength(1);
      expect(info!.evaluations?.[0]?.ev).toBe(0.8);
    });
  });

  describe("createStopCommand", () => {
    it("should return { type: 'stop' }", () => {
      expect(parser.createStopCommand()).toEqual({ type: "stop" });
    });
  });

  describe("parseInfo() evaluations catch block", () => {
    it("should filter out evaluations where createMahjongMove throws (invalid string)", () => {
      const input = {
        type: "info",
        thinking: "ok",
        evaluations: [
          { move: "INVALID_TILE_9999z", ev: 0.5 },
          { move: "7z", ev: 0.8 },
        ],
      };
      const info = parser.parseInfo(input);
      expect(info).not.toBeNull();
      expect(info!.evaluations).toHaveLength(1);
      expect(info!.evaluations?.[0]?.ev).toBe(0.8);
    });
  });

  describe("createOptionCommand() injection", () => {
    it("should throw on injection in name", () => {
      expect(() => parser.createOptionCommand("name\nstop", "value")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should throw on injection in value", () => {
      expect(() => parser.createOptionCommand("name", "val\0ue")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should return valid command object for clean name/value", () => {
      const cmd = parser.createOptionCommand("ThreadCount", 4);
      expect(cmd).toEqual({ type: "option", name: "ThreadCount", value: "4" });
    });
  });
});
