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
 * Parsed FEN result.
 */
export interface ParsedFEN {
  board: (ChessPiece | null)[][];
  turn: "w" | "b";
}

/**
 * Parsed SFEN result.
 */
export interface ParsedSFEN {
  board: (ShogiPiece | null)[][];
  turn: "b" | "w";
  hand: ShogiHand;
}

/**
 * Parses a Chess FEN string into a 2D board array.
 * @param fen Chess FEN string.
 * @returns Parsed board and metadata.
 */
export function parseFEN(fen: string): ParsedFEN {
  const [position, turn] = fen.split(" ");
  const rows = position!.split("/");
  const board: (ChessPiece | null)[][] = [];

  for (const row of rows) {
    const boardRow: (ChessPiece | null)[] = [];
    for (const char of row) {
      if (/[1-8]/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let i = 0; i < emptyCount; i++) {
          boardRow.push(null);
        }
      } else {
        boardRow.push(char as ChessPiece);
      }
    }
    board.push(boardRow);
  }

  return {
    board,
    turn: turn === "w" ? "w" : "b",
  };
}

/**
 * Parses a Shogi SFEN string into a 2D board array and hand counts.
 * @param sfen Shogi SFEN string.
 * @returns Parsed board, hand and metadata.
 */
export function parseSFEN(sfen: string): ParsedSFEN {
  const [position, turn, handStr] = sfen.split(" ");
  const rows = position!.split("/");
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
        boardRow.push(`+${row[i + 1]}` as ShogiPiece);
        i += 2;
      } else {
        boardRow.push(char as ShogiPiece);
        i++;
      }
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
      while (/[0-9]/.test(handStr[i]!)) {
        countStr += handStr[i];
        i++;
      }
      const count = countStr === "" ? 1 : parseInt(countStr, 10);
      const piece = handStr[i] as keyof ShogiHand;
      hand[piece] = count;
      i++;
    }
  }

  return {
    board,
    turn: turn === "b" ? "b" : "w",
    hand,
  };
}
