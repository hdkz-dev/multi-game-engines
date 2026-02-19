import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { parseFEN, ChessPiece } from "@multi-game-engines/ui-core/chess";
import { FEN, createFEN } from "@multi-game-engines/core/chess";
import { Move } from "@multi-game-engines/core";
import { locales } from "@multi-game-engines/i18n";

// Standard SVG piece set (Wikipedia/Standard) - Inlined as Data URIs for SRI compliance and zero external dependencies.
const PIECE_SVG: Record<ChessPiece, string> = {
  P: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cpath d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.36 1.7.94 2.28C19.15 15.59 19 15.79 19 16c0 .55.45 1 1 1h7c.55 0 1-.45 1-1 0-.21-.15-.41-.44-.72.58-.58.94-1.39.94-2.28 0-2.21-1.79-4-4-4h-2.5zM23 29.5c-4.42 0-8 1.57-8 3.5h16c0-1.93-3.58-3.5-8-3.5z' fill='%23fff' stroke='%23000' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E",
  N: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' fill='%23fff' stroke='%23000' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E",
  B: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='%23fff' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z'/%3E%3Cpath d='M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3E%3Cpath d='M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3E%3C/g%3E%3C/svg%3E",
  R: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='%23fff' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5'/%3E%3Cpath d='M34 14l-3 3H14l-3-3'/%3E%3Cpath d='M31 17v12.5H14V17'/%3E%3Cpath d='M31 29.5l1.5 2.5h-20l1.5-2.5'/%3E%3Cpath d='M11 14h23' fill='none' stroke='%23000' stroke-linejoin='miter'/%3E%3C/g%3E%3C/svg%3E",
  Q: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='%23fff' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM11 20a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM38 20a2 2 0 1 1-4 0 2 2 0 1 1 4 0z'/%3E%3Cpath d='M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12z'/%3E%3Cpath d='M9 26c0 2 1.5 2 2.5 4 1 1 1 1 1 1h20s0 0 1-1c1-2 2.5-2 2.5-4 0 0-4.5-1.5-13.5-1.5S9 26 9 26z'/%3E%3Cpath d='M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0' fill='none'/%3E%3C/g%3E%3C/svg%3E",
  K: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='%23fff' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22.5 11.63V6M20 8h5' fill='none' stroke-linejoin='miter'/%3E%3Cpath d='M22.5 25s4.5-7.5 3-10c-1.5-2.5-6-2.5-6 0-1.5 2.5 3 10 3 10z'/%3E%3Cpath d='M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-1-1-4-1-3 0-3 2-3 2s-1.5-3.5-4.5-3.5c-3 0-4.5 3.5-4.5 3.5s-1.5-3.5-4.5-3.5c-3 0-4.5 3.5-4.5 3.5s0-2-3-2c-3 0-0 0-4 1-3 6 6 10.5 6 10.5v7z'/%3E%3Cpath d='M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0' fill='none'/%3E%3C/g%3E%3C/svg%3E",
  p: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cpath d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.36 1.7.94 2.28C19.15 15.59 19 15.79 19 16c0 .55.45 1 1 1h7c.55 0 1-.45 1-1 0-.21-.15-.41-.44-.72.58-.58.94-1.39.94-2.28 0-2.21-1.79-4-4-4h-2.5zM23 29.5c-4.42 0-8 1.57-8 3.5h16c0-1.93-3.58-3.5-8-3.5z' fill='%23000' stroke='%23fff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E",
  n: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' fill='%23000' stroke='%23fff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E",
  b: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='%23000' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'%3E%3Cpath d='M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z'/%3E%3Cpath d='M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3E%3Cpath d='M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3E%3C/g%3E%3C/svg%3E",
  r: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='%23000' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'%3E%3Cpath d='M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5'/%3E%3Cpath d='M34 14l-3 3H14l-3-3'/%3E%3Cpath d='M31 17v12.5H14V17'/%3E%3Cpath d='M31 29.5l1.5 2.5h-20l1.5-2.5'/%3E%3Cpath d='M11 14h23' fill='none' stroke='%23fff' stroke-linejoin='miter'/%3E%3C/g%3E%3C/svg%3E",
  q: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='%23000' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'%3E%3Cpath d='M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM11 20a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM38 20a2 2 0 1 1-4 0 2 2 0 1 1 4 0z'/%3E%3Cpath d='M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12z'/%3E%3Cpath d='M9 26c0 2 1.5 2 2.5 4 1 1 1 1 1 1h20s0 0 1-1c1-2 2.5-2 2.5-4 0 0-4.5-1.5-13.5-1.5S9 26 9 26z'/%3E%3Cpath d='M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0' fill='none'/%3E%3C/g%3E%3C/svg%3E",
  k: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='%23000' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'%3E%3Cpath d='M22.5 11.63V6M20 8h5' fill='none' stroke-linejoin='miter'/%3E%3Cpath d='M22.5 25s4.5-7.5 3-10c-1.5-2.5-6-2.5-6 0-1.5 2.5 3 10 3 10z'/%3E%3Cpath d='M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-1-1-4-1-3 0-3 2-3 2s-1.5-3.5-4.5-3.5c-3 0-4.5 3.5-4.5 3.5s-1.5-3.5-4.5-3.5c-3 0-4.5 3.5-4.5 3.5s0-2-3-2c-3 0-0 0-4 1-3 6 6 10.5 6 10.5v7z'/%3E%3Cpath d='M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0' fill='none'/%3E%3C/g%3E%3C/svg%3E",
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
      width: 80%;
      height: 80%;
      object-fit: contain;
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
  @property({ type: String, reflect: true })
  fen: FEN = createFEN(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );

  /**
   * Last move to highlight (e.g., "e2e4").
   */
  @property({ type: String, attribute: "last-move", reflect: true })
  lastMove: Move | "" = "";

  /**
   * Current locale for default labels.
   */
  @property({ type: String })
  locale = "en";

  /**
   * Board orientation.
   */
  @property({ type: String, reflect: true })
  orientation: "white" | "black" = "white";

  /**
   * Accessible label for the board.
   */
  @property({ type: String, attribute: "board-label", reflect: true })
  boardLabel = "";

  /**
   * Error message to display when position parsing fails.
   */
  @property({ type: String, attribute: "error-message", reflect: true })
  errorMessage = "";

  /**
   * Custom piece names for accessibility (aria-labels).
   */
  @property({ type: Object })
  pieceNames: Partial<Record<ChessPiece, string>> = {};

  private _getLocalizedStrings() {
    const data = this.locale === "ja" ? locales.ja : locales.en;
    return {
      boardLabel: this.boardLabel || data.dashboard.gameBoard.title,
      errorMessage:
        this.errorMessage || data.dashboard.gameBoard.invalidPosition,
      pieceNames: data.dashboard.gameBoard.chessPieces as Record<
        ChessPiece,
        string
      >,
      squareLabel: (f: string, r: number) =>
        data.dashboard.gameBoard.squareLabel
          .replace("{file}", f)
          .replace("{rank}", String(r)),
      squarePieceLabel: (f: string, r: number, p: string) =>
        data.dashboard.gameBoard.squarePieceLabel
          .replace("{file}", f)
          .replace("{rank}", String(r))
          .replace("{piece}", p),
    };
  }

  private _getSquareIndex(algebraic: string): number {
    if (!algebraic || algebraic.length < 2) return -1;
    const file = algebraic.charCodeAt(0) - 97; // a=0, b=1...
    const rank = 8 - parseInt(algebraic[1]!, 10);
    if (file < 0 || file >= 8 || rank < 0 || rank >= 8) return -1;
    return rank * 8 + file;
  }

  override render() {
    const strings = this._getLocalizedStrings();
    let board: (ChessPiece | null)[][] = [];
    try {
      ({ board } = parseFEN(this.fen));
    } catch {
      return html`
        <div class="board" role="alert">
          <div class="error-overlay">${strings.errorMessage}</div>
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

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const rankIndex = this.orientation === "white" ? r : 7 - r;
        const fileIndex = this.orientation === "white" ? f : 7 - f;

        const squareIdx = rankIndex * 8 + fileIndex;
        const piece = board[rankIndex]?.[fileIndex];
        const algebraicRank = 8 - rankIndex;
        const algebraicFile = String.fromCharCode(97 + fileIndex);
        const isDark = (rankIndex + fileIndex) % 2 !== 0;
        const isHighlighted = highlightedSquares.has(squareIdx);

        const pieceName = piece
          ? this.pieceNames[piece] || strings.pieceNames[piece]
          : "";

        const ariaLabel = piece
          ? strings.squarePieceLabel(algebraicFile, algebraicRank, pieceName)
          : strings.squareLabel(algebraicFile, algebraicRank);

        squares.push(html`
          <div
            class="square ${isDark ? "dark" : "light"} ${isHighlighted
              ? "highlight"
              : ""}"
            data-square="${algebraicFile}${algebraicRank}"
            role="gridcell"
            aria-label="${ariaLabel}"
          >
            ${piece
              ? html`
                  <img
                    class="piece"
                    src="${PIECE_SVG[piece]}"
                    alt="${pieceName}"
                    aria-hidden="true"
                  />
                `
              : ""}
          </div>
        `);
      }
    }

    return html`
      <div class="board" role="grid" aria-label="${strings.boardLabel}">
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
