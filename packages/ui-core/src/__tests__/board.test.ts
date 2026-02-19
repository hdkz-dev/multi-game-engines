import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { parseFEN } from "../domains/chess/index.js";
import { parseSFEN } from "../domains/shogi/index.js";
import { createFEN, FEN } from "@multi-game-engines/core/chess";
import { createSFEN, SFEN } from "@multi-game-engines/core/shogi";

describe("Board Utilities", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

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
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w - - 0 1" as FEN; // 7 rows
      expect(() => parseFEN(fen)).toThrow("Invalid board structure");
    });

    it("should throw error for invalid character", () => {
      const fen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNZ w - - 0 1" as FEN; // 'Z' is invalid
      expect(() => parseFEN(fen)).toThrow("Invalid character");
    });
  });

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
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSN b - 1" as SFEN; // last row missing piece
      expect(() => parseSFEN(sfen)).toThrow("invalid length");
    });

    it("should throw error for incomplete promoted piece", () => {
      const sfen = "9/9/9/9/9/9/9/9/8+ b - 1" as SFEN; // '+' at end
      expect(() => parseSFEN(sfen)).toThrow("Malformed SFEN");
    });

    it("should throw error for invalid piece character", () => {
      const sfen = "9/9/9/9/9/9/9/9/8Z b - 1" as SFEN; // 'Z' is invalid
      expect(() => parseSFEN(sfen)).toThrow("Invalid character");
    });
  });

  describe("Parser Robustness", () => {
    it("parseFEN should throw on empty string", () => {
      expect(() => parseFEN("" as FEN)).toThrow("is empty");
    });

    it("parseSFEN should throw on empty string", () => {
      expect(() => parseSFEN("" as SFEN)).toThrow("is empty");
    });
  });
});
