import { FEN, SFEN } from "@multi-game-engines/core";

/**
 * Chess piece identifiers.
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
 * Shogi piece identifiers.
 * Uppercase for Sente (Black), Lowercase for Gote (White).
 * "+" prefix for promoted pieces.
 */
export type ShogiPiece =
  | "P"
  | "L"
  | "N"
  | "S"
  | "G"
  | "B"
  | "R"
  | "K"
  | "p"
  | "l"
  | "n"
  | "s"
  | "g"
  | "b"
  | "r"
  | "k"
  | "+P"
  | "+L"
  | "+N"
  | "+S"
  | "+B"
  | "+R"
  | "+p"
  | "+l"
  | "+n"
  | "+s"
  | "+b"
  | "+r";

/**
 * Branded type for FEN (Chess position).
 */
export type { FEN };

/**
 * Branded type for SFEN (Shogi position).
 */
export type { SFEN };

/**
 * Represents the count of captured pieces in Shogi.
 */
export interface ShogiHand {
  P: number;
  L: number;
  N: number;
  S: number;
  G: number;
  B: number;
  R: number;
  p: number;
  l: number;
  n: number;
  s: number;
  g: number;
  b: number;
  r: number;
}

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
 * Parsed SFEN result containing the 2D board array, turn, and hand counts.
 */
export interface ParsedSFEN {
  /** 9x9 grid of pieces. board[0] is Rank 1 (top), board[8] is Rank 9 (bottom). */
  board: (ShogiPiece | null)[][];
  /** Whose turn it is: 'b' for Sente (Black), 'w' for Gote (White). */
  turn: "b" | "w";
  /** Counts of pieces in hand. */
  hand: ShogiHand;
}

/**
 * Validates if a character is a valid Chess piece identifier.
 * @param char The character to validate.
 * @returns True if valid.
 */
export function isValidChessPiece(char: string): char is ChessPiece {
  return /^[PNBRQKpnbrqk]$/.test(char);
}

/**
 * Validates if a string is a valid Shogi piece identifier (including promoted pieces).
 * @param str The string to validate.
 * @returns True if valid.
 */
export function isValidShogiPiece(str: string): str is ShogiPiece {
  // Only allow '+' for promotable pieces: P, L, N, S, B, R
  return /^(?:\+[PLNSBRplnsbr]|[PLNSGBRKplnsgbrk])$/.test(str);
}

/**
 * Type guard for ShogiHand keys (unpromoted pieces that can be held in hand).
 * @param piece The piece identifier to check.
 * @returns True if it's a valid hand key.
 */
export function isShogiHandKey(piece: unknown): piece is keyof ShogiHand {
  return typeof piece === "string" && /^[PLNSGBRplnsgbr]$/.test(piece);
}

/**
 * Parses a Chess FEN string into a structured 2D board array.
 * @param fen Validated Chess FEN string.
 * @returns Parsed board and metadata.
 * @throws Error if FEN is malformed.
 */
export function parseFEN(fen: FEN): ParsedFEN {
  if (!fen) throw new Error("[parseFEN] FEN string is empty.");

  const parts = fen.split(" ");
  const position = parts[0] || "";
  const turn = (parts[1] || "w") as "w" | "b";

  if (!position) throw new Error("[parseFEN] Position part is missing.");
  if (turn !== "w" && turn !== "b") {
    throw new Error(
      `[parseFEN] Invalid turn: expected "w" or "b", got "${turn}"`,
    );
  }

  const rows = position.split("/");
  if (rows.length !== 8) {
    throw new Error(
      `[parseFEN] Invalid row count: expected 8, got ${rows.length}`,
    );
  }

  const board: (ChessPiece | null)[][] = [];

  for (const row of rows) {
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
        throw new Error(`[parseFEN] Invalid character in FEN: ${char}`);
      }
    }
    if (boardRow.length !== 8) {
      throw new Error(
        `[parseFEN] Invalid row length: expected 8, got ${boardRow.length} in row "${row}"`,
      );
    }
    board.push(boardRow);
  }

  return {
    board,
    turn,
  };
}

/**
 * Parses a Shogi SFEN string into a 2D board array and hand counts.
 * @param sfen Validated Shogi SFEN string.
 * @returns Parsed board, hand and metadata.
 * @throws Error if SFEN is malformed.
 */
export function parseSFEN(sfen: SFEN): ParsedSFEN {
  if (!sfen) throw new Error("[parseSFEN] SFEN string is empty.");

  const parts = sfen.split(" ");
  const position = parts[0] || "";
  const turn = (parts[1] || "b") as "b" | "w";
  const handStr = parts[2] || "-";

  if (!position) throw new Error("[parseSFEN] Position part is missing.");
  if (turn !== "b" && turn !== "w") {
    throw new Error(
      `[parseSFEN] Invalid turn: expected "b" or "w", got "${turn}"`,
    );
  }

  const rows = position.split("/");
  if (rows.length !== 9) {
    throw new Error(
      `[parseSFEN] Invalid row count: expected 9, got ${rows.length}`,
    );
  }

  const board: (ShogiPiece | null)[][] = [];

  for (const row of rows) {
    const boardRow: (ShogiPiece | null)[] = [];
    let i = 0;
    while (i < row.length) {
      const char = row[i]!;
      if (/[1-9]/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let j = 0; j < emptyCount; j++) {
          boardRow.push(null);
        }
        i++;
      } else if (char === "+") {
        if (i + 1 >= row.length) {
          throw new Error(
            `[parseSFEN] '+' prefix at end of row string in row "${row}".`,
          );
        }
        const piece = `+${row[i + 1]}`;
        if (isValidShogiPiece(piece)) {
          boardRow.push(piece);
          i += 2;
        } else {
          throw new Error(`[parseSFEN] Invalid promoted piece: ${piece}`);
        }
      } else if (isValidShogiPiece(char)) {
        boardRow.push(char);
        i++;
      } else {
        throw new Error(`[parseSFEN] Invalid character in SFEN: ${char}`);
      }
    }
    if (boardRow.length !== 9) {
      throw new Error(
        `[parseSFEN] Invalid row length: expected 9, got ${boardRow.length} in row "${row}"`,
      );
    }
    board.push(boardRow);
  }

  const hand: ShogiHand = {
    P: 0,
    L: 0,
    N: 0,
    S: 0,
    G: 0,
    B: 0,
    R: 0,
    p: 0,
    l: 0,
    n: 0,
    s: 0,
    g: 0,
    b: 0,
    r: 0,
  };

  if (handStr && handStr !== "-") {
    let i = 0;
    while (i < handStr.length) {
      let countStr = "";
      while (i < handStr.length && /[0-9]/.test(handStr[i]!)) {
        countStr += handStr[i];
        i++;
      }
      const count = countStr === "" ? 1 : parseInt(countStr, 10);
      const piece = handStr[i];
      if (!piece) {
        throw new Error(
          `[parseSFEN] Unexpected end of hand string: ${handStr}`,
        );
      }
      if (isShogiHandKey(piece)) {
        hand[piece] = count;
      } else {
        throw new Error(`[parseSFEN] Invalid piece in hand: ${piece}`);
      }
      i++;
    }
  }

  return {
    board,
    turn,
    hand,
  };
}
