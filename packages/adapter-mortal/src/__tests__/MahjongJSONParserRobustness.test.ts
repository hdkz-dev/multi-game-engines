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

  it("空文字列で null を返すこと", () => {
    expect(parser.parseInfo("")).toBeNull();
    expect(parser.parseResult("")).toBeNull();
  });

  it("有効な JSON だが想定外の構造で null を返すこと", () => {
    expect(parser.parseInfo("[]")).toBeNull();
    expect(parser.parseResult("[]")).toBeNull();
    expect(parser.parseInfo('"hello"')).toBeNull();
  });

  it("bestMove が不正な形式の場合に null を返すこと", () => {
    const data = '{"type":"result","bestMove":""}';
    expect(parser.parseResult(data)).toBeNull();
    const data2 = '{"type":"result","bestMove":"invalid"}';
    expect(parser.parseResult(data2)).toBeNull();
  });

  it("type が想定外の値の場合に null を返すこと", () => {
    const data = '{"type":"unknown","bestMove":"1m"}';
    expect(parser.parseResult(data)).toBeNull();
  });

  it("制御文字を含む不正な盤面データでエラーを投げること", () => {
    const maliciousBoard = {
      hand: ["1m\nquit"],
    };
    expect(() => parser.createSearchCommand({ board: maliciousBoard })).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
    );
  });
});
