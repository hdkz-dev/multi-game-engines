import { describe, it, expect } from "vitest";
import { parseFEN, createFEN, FEN } from "../index.js";

describe("parseFEN", () => {
  it("should parse initial position correctly", () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const { board, turn } = parseFEN(fen);

    expect(turn).toBe("w");
    expect(board[0]![0]).toBe("r");
    expect(board[0]![4]).toBe("k");
    expect(board[7]![4]).toBe("K");
    expect(board[3]![0]).toBeNull();
  });

  it("should handle empty squares", () => {
    const fen = createFEN("8/8/8/8/8/8/8/8 w - - 0 1");
    const { board } = parseFEN(fen);
    expect(
      board.every((row: (string | null)[]) => row.every((sq) => sq === null)),
    ).toBe(true);
  });

  it("should throw error for invalid row count", () => {
    const fen =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w - - 0 1" as unknown as FEN; // 7 rows
    expect(() => parseFEN(fen)).toThrow(/engine.errors.invalidFenRanks/);
  });

  it("should throw error for invalid character", () => {
    // Note: createFEN already validates characters, so to test parseFEN we bypass it
    const fen =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNZ w - - 0 1" as unknown as FEN;
    expect(() => parseFEN(fen)).toThrow(/engine.errors.invalidFenChar/);
  });

  it("should throw on empty string", () => {
    expect(() => parseFEN("" as unknown as FEN)).toThrow();
  });
});
