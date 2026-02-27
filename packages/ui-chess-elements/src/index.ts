import { LitElement, html, css, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import {
  parseFEN,
  FEN,
  ChessPiece,
  createFEN,
} from "@multi-game-engines/domain-chess";
import { Move, createMove } from "@multi-game-engines/core";
import { chessLocales } from "@multi-game-engines/i18n-chess";

/**
 * 2026 Zenith Tier: 再帰的な Record 型による Zero-Any ポリシーの遵守。
 */
type DeepRecord = {
  [key: string]: string | number | boolean | DeepRecord | undefined;
};

interface ChessBoardStrings {
  boardLabel: string;
  errorMessage: string;
  pieceNames: Record<string, string>;
  squareLabel: (f: string, r: number) => string;
  squarePieceLabel: (f: string, r: number, p: string) => string;
}

/**
 * チェス盤を表示するカスタム要素。
 */
export class ChessBoard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      container-type: size;
    }
    .board {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      grid-template-rows: repeat(8, 1fr);
      aspect-ratio: 1 / 1;
      width: 100%;
      border: 1px solid var(--board-border-color, #333);
      background-color: var(--board-bg, #f0d9b5);
    }
    .square {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(1rem, 8cqi, 3rem);
      position: relative;
      outline-offset: -2px;
    }
    .square:focus-visible {
      outline: 2px solid var(--board-focus-color, #2563eb);
      z-index: 1;
    }
    .square.white {
      background-color: var(--square-white, #f0d9b5);
    }
    .square.black {
      background-color: var(--square-black, #b58863);
    }
    .square.highlight {
      background-color: var(--board-highlight-color, rgba(255, 255, 0, 0.4));
    }
    .piece {
      cursor: default;
      user-select: none;
    }
    .error-overlay {
      color: #ef4444;
      font-weight: bold;
      text-align: center;
      padding: 20px;
    }
  `;

  private _fen: FEN = createFEN(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );
  @property({ type: String, reflect: true })
  get fen(): FEN {
    return this._fen;
  }
  set fen(value: string) {
    const old = this._fen;
    try {
      this._fen = value as unknown as FEN;
    } catch {
      console.warn(`[ChessBoard] Invalid FEN attribute: ${value}`);
    }
    this.requestUpdate("fen", old);
  }

  private _lastMove: Move | "" = "";
  @property({ type: String, attribute: "last-move", reflect: true })
  get lastMove(): Move | "" {
    return this._lastMove;
  }
  set lastMove(value: string) {
    const old = this._lastMove;
    try {
      this._lastMove = value === "" ? "" : createMove(value);
    } catch {
      this._lastMove = "";
    }
    this.requestUpdate("lastMove", old);
  }

  @property({ type: String, reflect: true }) locale = "en";
  @property({ type: String, reflect: true }) orientation: "white" | "black" =
    "white";
  @property({ type: String, attribute: "board-label", reflect: true })
  boardLabel = "";
  @property({ type: String, attribute: "error-message", reflect: true })
  errorMessage = "";
  @property({ type: Object }) pieceNames: Partial<Record<ChessPiece, string>> =
    {};

  @state()
  private _focusedIndex = 0;

  private _getLocalizedStrings(): ChessBoardStrings {
    const data = (this.locale === "ja" ? chessLocales.ja : chessLocales.en) as unknown as DeepRecord;
    const dashboard = (data["dashboard"] || {}) as DeepRecord;
    const gameBoard = (dashboard["gameBoard"] || {}) as DeepRecord;
    const engine = (data["engine"] || {}) as DeepRecord;
    const errors = (engine["errors"] || {}) as DeepRecord;
    const pieces = (gameBoard["chessPieces"] || {}) as Record<string, string>;

    return {
      boardLabel: String(this.boardLabel || gameBoard["title"] || "Chess Board"),
      errorMessage: String(this.errorMessage || errors["invalidFEN"] || ""),
      pieceNames: { ...pieces, ...this.pieceNames },
      squareLabel: (f: string, r: number) => `${f}${r}`,
      squarePieceLabel: (f: string, r: number, p: string) => `${p} at ${f}${r}`,
    };
  }

  private _getSquareIndex(algebraic: string): number {
    if (!algebraic || algebraic.length < 2) return -1;
    const file = algebraic.charCodeAt(0) - 97;
    const rank = 8 - parseInt(algebraic[1]!, 10);
    if (file < 0 || file >= 8 || rank < 0 || rank >= 8) return -1;
    return rank * 8 + file;
  }

  private _handleKeyDown(e: KeyboardEvent) {
    let newIndex = this._focusedIndex;
    const row = Math.floor(this._focusedIndex / 8);
    const col = this._focusedIndex % 8;

    switch (e.key) {
      case "ArrowUp":
        newIndex = Math.max(0, this._focusedIndex - 8);
        break;
      case "ArrowDown":
        newIndex = Math.min(63, this._focusedIndex + 8);
        break;
      case "ArrowLeft":
        newIndex = col > 0 ? this._focusedIndex - 1 : this._focusedIndex;
        break;
      case "ArrowRight":
        newIndex = col < 7 ? this._focusedIndex + 1 : this._focusedIndex;
        break;
      case "Home":
        newIndex = row * 8;
        break;
      case "End":
        newIndex = row * 8 + 7;
        break;
      default:
        return;
    }

    e.preventDefault();
    this._focusedIndex = newIndex;
    void this.updateComplete.then(() => {
      const el = this.shadowRoot?.querySelector(
        `[data-index="${newIndex}"]`,
      ) as HTMLElement;
      el?.focus();
    });
  }

  protected override willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    if (changedProperties.has("locale")) {
      // Force strings update if locale changes
      this.requestUpdate();
    }
  }

  override render() {
    const strings = this._getLocalizedStrings();
    let board: (ChessPiece | null)[][];
    try {
      const parsed = parseFEN(this.fen);
      board = parsed.board;
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
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        // orientation が black の場合、行と列を反転させる
        const row = this.orientation === "white" ? r : 7 - r;
        const col = this.orientation === "white" ? f : 7 - f;
        
        const squareIdx = row * 8 + col;
        const piece = board[row]?.[col];
        const isWhiteSquare = (row + col) % 2 === 0;
        const isHighlighted = highlightedSquares.has(squareIdx);
        
        const displayFile = files[col]!;
        const displayRank = 8 - row;
        const pieceLabel = piece
          ? (this.pieceNames[piece] as string) ||
            (strings.pieceNames[piece] as string)
          : "";
        const ariaLabel = piece
          ? strings.squarePieceLabel(displayFile, displayRank, pieceLabel)
          : strings.squareLabel(displayFile, displayRank);

        squares.push(html`
          <div
            class="square ${isWhiteSquare ? "white" : "black"} ${isHighlighted
              ? "highlight"
              : ""}"
            data-square="${displayFile}${displayRank}"
            data-index="${squareIdx}"
            role="gridcell"
            aria-label="${ariaLabel}"
            tabindex="${this._focusedIndex === squareIdx ? "0" : "-1"}"
            @click="${() => (this._focusedIndex = squareIdx)}"
          >
            ${piece
              ? html`<span class="piece" role="img" aria-hidden="true"
                  >${pieceLabel}</span
                >`
              : ""}
          </div>
        `);
      }
    }

    return html`
      <div
        class="board"
        role="grid"
        aria-label="${strings.boardLabel}"
        @keydown="${this._handleKeyDown}"
      >
        ${squares}
      </div>
    `;
  }
}

customElements.define("chess-board", ChessBoard);
