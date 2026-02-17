import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { parseFEN, ChessPiece } from "@multi-game-engines/ui-core";

// Simplified rendering using unicode characters for the initial prototype to ensure stability
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
  fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

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

  private _getSquareIndex(algebraic: string): number {
    const file = algebraic.charCodeAt(0) - 97; // a=0, b=1...
    const rank = 8 - parseInt(algebraic[1]!, 10);
    return rank * 8 + file;
  }

  override render() {
    const { board } = parseFEN(this.fen);
    const highlightedSquares = new Set<number>();

    if (this.lastMove && this.lastMove.length >= 4) {
      highlightedSquares.add(this._getSquareIndex(this.lastMove.slice(0, 2)));
      highlightedSquares.add(this._getSquareIndex(this.lastMove.slice(2, 4)));
    }

    const squares = [];

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const rank = this.orientation === "white" ? r : 7 - r;
        const file = this.orientation === "white" ? f : 7 - f;
        const squareIdx = rank * 8 + file;
        const piece = board[rank]?.[file];
        const isDark = (rank + file) % 2 !== 0;
        const isHighlighted = highlightedSquares.has(squareIdx);

        squares.push(html`
          <div
            class="square ${isDark ? "dark" : "light"} ${isHighlighted
              ? "highlight"
              : ""}"
            data-square="${String.fromCharCode(97 + file)}${8 - rank}"
          >
            ${piece
              ? html`<span class="piece" role="img" aria-label="${piece}"
                  >${PIECE_UNICODE[piece]}</span
                >`
              : ""}
          </div>
        `);
      }
    }

    return html`
      <div class="board" role="grid" aria-label="Chess Board">${squares}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chess-board": ChessBoard;
  }
}
