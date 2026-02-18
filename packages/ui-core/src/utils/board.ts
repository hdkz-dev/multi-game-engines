import { FEN, SFEN } from "@multi-game-engines/core";

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
 * 将棋の駒識別子。
 * 大文字は先手 (Sente)、小文字は後手 (Gote)。
 * "+" プレフィックスは成駒を表す。
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
 * 文字が有効なチェスの駒識別子かどうかを検証します。
 * @param char 検証する文字。
 * @returns 有効な場合 true。
 */
export function isValidChessPiece(char: string): char is ChessPiece {
  return /^[PNBRQKpnbrqk]$/.test(char);
}

/**
 * 文字列が有効な将棋の駒識別子（成駒を含む）かどうかを検証します。
 * @param str 検証する文字列。
 * @returns 有効な場合 true。
 */
export function isValidShogiPiece(str: string): str is ShogiPiece {
  // Only allow '+' for promotable pieces: P, L, N, S, B, R
  return /^(?:\+[PLNSBRplnsbr]|[PLNSGBRKplnsgbrk])$/.test(str);
}

/**
 * 将棋の持ち駒キー（持ち駒にできる不成駒）の型ガード。
 * @param piece 検証する駒識別子。
 * @returns 有効な持ち駒キーの場合 true。
 */
export function isShogiHandKey(piece: unknown): piece is keyof ShogiHand {
  return typeof piece === "string" && /^[PLNSGBRplnsgbr]$/.test(piece);
}

/**
 * FEN 文字列を解析して 2D 盤面配列に変換します。
 * @param fen 検証済みの FEN 文字列。
 * @returns 解析された盤面とメタデータ。
 * @throws FEN が不正な場合にエラーをスローします。
 */
export function parseFEN(fen: FEN): ParsedFEN {
  if (!fen) throw new Error("[parseFEN] FEN string is empty.");

  const parts = fen.split(" ");
  const position = parts[0] || "";
  const turnPart = parts[1];

  if (!position) throw new Error("[parseFEN] Position part is missing.");
  if (!turnPart) throw new Error("[parseFEN] Turn part is missing.");

  const turn = turnPart as "w" | "b";

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
 * SFEN 文字列を解析して 2D 盤面配列と持ち駒数に変換します。
 * @param sfen 検証済みの SFEN 文字列。
 * @returns 解析された盤面、持ち駒、メタデータ。
 * @throws SFEN が不正な場合にエラーをスローします。
 */
export function parseSFEN(sfen: SFEN): ParsedSFEN {
  if (!sfen) throw new Error("[parseSFEN] SFEN string is empty.");

  const parts = sfen.split(" ");
  const position = parts[0] || "";
  const turnPart = parts[1];
  const handStr = parts[2] || "-";

  if (!position) throw new Error("[parseSFEN] Position part is missing.");
  if (!turnPart) throw new Error("[parseSFEN] Turn part is missing.");

  const turn = turnPart as "b" | "w";

  if (turn !== "b" && turn !== "w") {
    throw new Error(
      `[parseSFEN] Invalid turn: expected "b" or "w", got "${turnPart}"`,
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
