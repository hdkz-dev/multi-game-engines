import { describe, it, expect } from "vitest";
import { MahjongJSONParser } from "../MahjongJSONParser.js";

describe("MahjongJSONParser 堅牢性", () => {
  const parser = new MahjongJSONParser();

  it("parseInfo において無効な JSON を適切に処理できること", () => {
    const invalidJson = "{ invalid: json }";
    const info = parser.parseInfo(invalidJson);
    expect(info).toBeNull();
  });

  it("parseResult において無効な JSON を適切に処理できること", () => {
    const invalidJson = "{ invalid: json }";
    const result = parser.parseResult(invalidJson);
    expect(result).toBeNull();
  });
});
