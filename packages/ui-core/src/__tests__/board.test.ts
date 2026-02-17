import { describe, it, expect } from "vitest";
import { parseFEN, parseSFEN, FEN, SFEN } from "../utils/board.js";

describe("Board Utilities", () => {
  describe("parseFEN", () => {
    it("should parse initial position correctly", () => {
      const fen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" as FEN;
      const { board, turn } = parseFEN(fen);

      expect(turn).toBe("w");
      expect(board[0]![0]).toBe("r");
      expect(board[0]![4]).toBe("k");
      expect(board[7]![4]).toBe("K");
      expect(board[3]![0]).toBeNull();
    });

    it("should handle empty squares", () => {
      const fen = "8/8/8/8/8/8/8/8 w - - 0 1" as FEN;
      const { board } = parseFEN(fen);
      expect(board.every((row) => row.every((sq) => sq === null))).toBe(true);
    });

    it("should throw error for invalid row count", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w" as FEN; // 7 rows
      expect(() => parseFEN(fen)).toThrow("Invalid row count");
    });

    it("should throw error for invalid character", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNZ w" as FEN; // 'Z' is invalid
      expect(() => parseFEN(fen)).toThrow("Invalid character");
    });
  });

  describe("parseSFEN", () => {
    it("should parse initial position correctly", () => {
      const sfen =
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1" as SFEN;
      const { board, turn, hand } = parseSFEN(sfen);

      expect(turn).toBe("b");
      expect(board[0]![0]).toBe("l");
      expect(board[0]![4]).toBe("k");
      expect(board[8]![4]).toBe("K");
      expect(hand.P).toBe(0);
    });

    it("should parse promoted pieces", () => {
      const sfen = "8k/1+P7/9/9/9/9/9/9/9 b - 1" as SFEN;
      const { board } = parseSFEN(sfen);
      expect(board[1]![1]).toBe("+P");
    });

    it("should parse hand counts", () => {
      const sfen = "9/9/9/9/9/9/9/9/9 b 2P3g 1" as SFEN;
      const { hand } = parseSFEN(sfen);
      expect(hand.P).toBe(2);
      expect(hand.g).toBe(3);
    });

    it("should throw error for invalid row length", () => {
      const sfen =
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSN b" as SFEN; // last row missing piece
      expect(() => parseSFEN(sfen)).toThrow("Invalid row length");
    });

    it("should throw error for incomplete promoted piece", () => {
      const sfen = "9/9/9/9/9/9/9/9/8+ b" as SFEN; // '+' at end
      expect(() => parseSFEN(sfen)).toThrow("'+' prefix at end of row string");
    });
  });
});
