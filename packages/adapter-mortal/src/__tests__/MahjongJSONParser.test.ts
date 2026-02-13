import { describe, it, expect } from "vitest";
import { MahjongJSONParser } from "../MahjongJSONParser.js";

describe("MahjongJSONParser", () => {
  const parser = new MahjongJSONParser();

  it("should parse JSON info correctly", () => {
    const info = parser.parseInfo({ type: "info", data: "thinking" });
    expect(info).toBeDefined();
    expect(info?.raw).toBeDefined();
  });

  it("should parse JSON result correctly", () => {
    const result = parser.parseResult({ type: "result", move: "7z" });
    expect(result).toBeDefined();
    expect(result?.raw).toBeDefined();
  });
});
