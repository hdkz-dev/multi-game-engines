import { ChessLocale } from "../types.js";

export default {
  engine: {
    title: "Chess Engine",
    status: "Status",
    depth: "Depth",
    nodes: "Nodes",
    nps: "NPS",
    time: "Time",
    score: "Score",
    visits: "Visits",
    mateIn: "Mate in {n}",
    advantage: "Advantage +{v}",
    sideWhite: "White",
    sideBlack: "Black",
  },
  gameBoard: {
    title: "Chess Board",
    chessPieces: {
      P: "White Pawn",
      N: "White Knight",
      B: "White Bishop",
      R: "White Rook",
      Q: "White Queen",
      K: "White King",
      p: "Black Pawn",
      n: "Black Knight",
      b: "Black Bishop",
      r: "Black Rook",
      q: "Black Queen",
      k: "Black King",
    },
  },
  errors: {
    missingFEN: "FEN string is missing in search options.",
    invalidFEN: 'Invalid FEN format: "{fen}".',
  },
} satisfies ChessLocale;
