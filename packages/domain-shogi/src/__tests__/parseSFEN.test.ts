import { describe, it, expect } from "vitest";
import { parseSFEN, createSFEN, SFEN } from "../index.js";

describe("parseSFEN", () => {
  it("should parse initial position correctly", () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    const { board, turn, hand } = parseSFEN(sfen);

    expect(turn).toBe("b");
    expect(board[0]![0]).toBe("l");
    expect(board[0]![4]).toBe("k");
    expect(board[8]![4]).toBe("K");
    expect(hand.P).toBe(0);
  });

  it("should parse promoted pieces", () => {
    const sfen = createSFEN("8k/1+P7/9/9/9/9/9/9/9 b - 1");
    const { board } = parseSFEN(sfen);
    expect(board[1]![1]).toBe("+P");
  });

  it("should parse hand counts", () => {
    const sfen = createSFEN("9/9/9/9/9/9/9/9/9 b 2P3g 1");
    const { hand } = parseSFEN(sfen);
    expect(hand.P).toBe(2);
    expect(hand.g).toBe(3);
  });

  it("should throw error for invalid row length", () => {
    const sfen =
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSN b - 1" as unknown as SFEN; // last row missing piece
    expect(() => parseSFEN(sfen)).toThrow(/engine.errors.invalidSfenRankWidth/);
  });

  it("should throw error for invalid piece character", () => {
    const sfen = "9/9/9/9/9/9/9/9/8Z b - 1" as unknown as SFEN; // 'Z' is invalid
    expect(() => parseSFEN(sfen)).toThrow(/engine.errors.invalidSfenChar/);
  });

  it("should throw on empty string", () => {
    expect(() => parseSFEN("" as unknown as SFEN)).toThrow();
  });
});
