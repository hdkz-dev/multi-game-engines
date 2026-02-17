import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { parseFEN, ChessPiece, FEN } from "@multi-game-engines/ui-core";
import { createFEN } from "@multi-game-engines/core";

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
    .error-overlay {
      color: #ef4444;
      font-weight: bold;
      text-align: center;
      padding: 20px;
    }
  `;

  /**
   * Current position in FEN format.
   */
  @property({ type: String })
  fen: FEN = createFEN(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );

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
    if (!algebraic || algebraic.length < 2) return -1;
    const file = algebraic.charCodeAt(0) - 97; // a=0, b=1...
    const rank = 8 - parseInt(algebraic[1]!, 10);
    if (file < 0 || file >= 8 || rank < 0 || rank >= 8) return -1;
    return rank * 8 + file;
  }

  override render() {
    let board: (ChessPiece | null)[][] = [];
    try {
      ({ board } = parseFEN(this.fen));
    } catch (err) {
      console.error("[chess-board] Failed to parse FEN:", err);
      return html`
        <div class="board" role="alert">
          <div class="error-overlay">Invalid Position</div>
        </div>
      `;
    }

    const highlightedSquares = new Set<number>();

    if (this.lastMove && this.lastMove.length >= 4) {
      const from = this._getSquareIndex(this.lastMove.slice(0, 2));
      const to = this._getSquareIndex(this.lastMove.slice(2, 4));
      if (from >= 0) highlightedSquares.add(from);
      if (to >= 0) highlightedSquares.add(to);
    }

    const squares = [];

    // r: 0-7 (visual row from top to bottom)
    // f: 0-7 (visual column from left to right)
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const rankIndex = this.orientation === "white" ? r : 7 - r;
        const fileIndex = this.orientation === "white" ? f : 7 - f;

        const squareIdx = rankIndex * 8 + fileIndex;
        const piece = board[rankIndex]?.[fileIndex];
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
