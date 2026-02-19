import { FEN } from "@multi-game-engines/core/chess";

/**
 * チェスの駒識別子。
 */
export type ChessPiece =
  | "P"
  | "N"
  | "B"
  | "R"
  | "Q"
  | "K"
  | "p"
  | "n"
  | "b"
  | "r"
  | "q"
  | "k";

/**
 * Parsed FEN result containing the 2D board array and turn metadata.
 */
export interface ParsedFEN {
  /** 8x8 grid of pieces. board[0] is Rank 8, board[7] is Rank 1. */
  board: (ChessPiece | null)[][];
  /** Whose turn it is: 'w' for White, 'b' for Black. */
  turn: "w" | "b";
}

/**
 * 文字が有効なチェスの駒識別子かどうかを検証します。
 * @param char 検証する文字。
 * @returns 有効な場合 true。
 */
export function isValidChessPiece(char: string): char is ChessPiece {
  return /^[PNBRQKpnbrqk]$/.test(char);
}

/**
 * FEN 文字列を解析して 2D 盤面配列に変換します。
 * @param fen 検証済みの FEN 文字列。
 * @returns 解析された盤面とメタデータ。
 * @throws FEN が不正な場合にエラーをスローします。
 */
export function parseFEN(fen: FEN): ParsedFEN {
  if (!fen) throw new Error("[parseFEN] FEN string is empty or undefined.");

  const parts = fen.trim().split(/\s+/);
  const position = parts[0];
  const turnPart = parts[1];

  if (!position)
    throw new Error("[parseFEN] Position part is missing in FEN string.");
  if (!turnPart)
    throw new Error(
      "[parseFEN] Turn part is missing in FEN string (expected 'w' or 'b' as the second part).",
    );

  if (turnPart !== "w" && turnPart !== "b") {
    throw new Error(
      `[parseFEN] Invalid turn indicator: expected "w" or "b", got "${turnPart}" at the second part.`,
    );
  }

  const turn = turnPart;

  const rows = position.split("/");
  if (rows.length !== 8) {
    throw new Error(
      `[parseFEN] Invalid board structure: expected 8 ranks (separated by '/'), but found ${rows.length} ranks.`,
    );
  }

  const board: (ChessPiece | null)[][] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    const boardRow: (ChessPiece | null)[] = [];
    for (const char of row) {
      if (/[1-8]/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let i = 0; i < emptyCount; i++) {
          boardRow.push(null);
        }
      } else if (isValidChessPiece(char)) {
        boardRow.push(char);
      } else {
        throw new Error(
          `[parseFEN] Invalid character "${char}" found at rank ${8 - r} (FEN row ${r + 1}).`,
        );
      }
    }
    if (boardRow.length !== 8) {
      throw new Error(
        `[parseFEN] Rank ${8 - r} (row ${r + 1}) has an invalid length: expected 8 squares, but got ${boardRow.length}. Row string: "${row}"`,
      );
    }
    board.push(boardRow);
  }

  return {
    board,
    turn,
  };
}
