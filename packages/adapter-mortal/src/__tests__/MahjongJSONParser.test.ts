import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { MahjongJSONParser } from "../MahjongJSONParser.js";
import { EngineError, EngineErrorCode } from "@multi-game-engines/core";

describe("MahjongJSONParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
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
    const options = { board: "bad\ninput" };
    expect(() => parser.createSearchCommand(options)).toThrow(EngineError);
    try {
      parser.createSearchCommand(options);
    } catch (e) {
      expect(e).toBeInstanceOf(EngineError);
      expect((e as EngineError).code).toBe(EngineErrorCode.SECURITY_ERROR);
    }
  });

  it("should detect injection in nested object", () => {
    const options = { board: { hand: ["1m", "bad\rinput"] } };
    expect(() => parser.createSearchCommand(options)).toThrow(EngineError);
  });

  it("should detect injection in deep nested object", () => {
    const options = {
      board: { players: [{ name: "p1", history: ["good", "bad\0"] }] },
    };
    expect(() => parser.createSearchCommand(options)).toThrow(EngineError);
  });
});
