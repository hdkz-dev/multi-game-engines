import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { parseFEN, ChessPiece, FEN } from "@multi-game-engines/ui-core";

// Human-readable names for accessibility
const PIECE_NAMES: Record<ChessPiece, string> = {
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
};

// Standard Unicode characters
const PIECE_UNICODE: Record<ChessPiece, string> = {
  P: "♙",
  N: "♘",
  B: "♗",
  R: "♖",
  Q: "♕",
  K: "♔",
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

/**
 * A framework-agnostic Chess board component.
 * @element chess-board
 */
@customElement("chess-board")
export class ChessBoard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      aspect-ratio: 1 / 1;
      width: 100%;
      max-width: 600px;
      user-select: none;
    }
    .board {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      grid-template-rows: repeat(8, 1fr);
      width: 100%;
      height: 100%;
      border: 2px solid var(--board-border-color, #333);
    }
    .square {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(1rem, 8cqi, 3rem);
      position: relative;
    }
    .square.light {
      background-color: var(--board-light-square, #ebecd0);
    }
    .square.dark {
      background-color: var(--board-dark-square, #779556);
    }
    .square.highlight {
      background-color: var(--board-highlight-color, rgba(255, 255, 0, 0.5));
    }
    .piece {
      cursor: default;
      z-index: 1;
    }
  `;

  /**
   * Current position in FEN format.
   */
  @property({ type: String })
  fen: FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" as FEN;

  /**
   * Last move to highlight (e.g., "e2e4").
   */
  @property({ type: String, attribute: "last-move" })
  lastMove = "";

  /**
   * Board orientation.
   */
  @property({ type: String })
  orientation: "white" | "black" = "white";

  /**
   * Accessible label for the board.
   */
  @property({ type: String, attribute: "board-label" })
  boardLabel = "Chess Board";

  private _getSquareIndex(algebraic: string): number {
    const file = algebraic.charCodeAt(0) - 97; // a=0, b=1...
    const rank = 8 - parseInt(algebraic[1]!, 10);
    return rank * 8 + file;
  }

  override render() {
    const { board } = parseFEN(this.fen);
    const highlightedSquares = new Set<number>();

    if (this.lastMove && this.lastMove.length >= 4) {
      try {
        const from = this._getSquareIndex(this.lastMove.slice(0, 2));
        const to = this._getSquareIndex(this.lastMove.slice(2, 4));
        if (from >= 0 && from < 64) highlightedSquares.add(from);
        if (to >= 0 && to < 64) highlightedSquares.add(to);
      } catch {
        // Ignore invalid moves
      }
    }

    const squares = [];

    // r: 0-7 (visual row from top to bottom)
    // f: 0-7 (visual column from left to right)
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        // Map visual coordinates to board array indices
        // parseFEN returns board[0] as Rank 8, board[7] as Rank 1.

        // If White bottom: Top row (r=0) is Rank 8 (index 0)
        // If Black bottom: Top row (r=0) is Rank 1 (index 7)
        const rankIndex = this.orientation === "white" ? r : 7 - r;

        // If White bottom: Left col (f=0) is File A (index 0)
        // If Black bottom: Left col (f=0) is File H (index 7)
        const fileIndex = this.orientation === "white" ? f : 7 - f;

        const squareIdx = rankIndex * 8 + fileIndex;
        const piece = board[rankIndex]?.[fileIndex];
        // Calculate algebraic rank for display (data-square)
        // rankIndex 0 -> "8", rankIndex 7 -> "1"
        const algebraicRank = 8 - rankIndex;
        const isDark = (rankIndex + fileIndex) % 2 !== 0;
        const isHighlighted = highlightedSquares.has(squareIdx);

        squares.push(html`
          <div
            class="square ${isDark ? "dark" : "light"} ${isHighlighted
              ? "highlight"
              : ""}"
            data-square="${String.fromCharCode(97 + fileIndex)}${algebraicRank}"
          >
            ${piece
              ? html`
                  <span
                    class="piece"
                    role="img"
                    aria-label="${PIECE_NAMES[piece]}"
                  >
                    ${PIECE_UNICODE[piece]}
                  </span>
                `
              : ""}
          </div>
        `);
      }
    }

    return html`
      <div class="board" role="grid" aria-label="${this.boardLabel}">
        ${squares}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chess-board": ChessBoard;
  }
}
