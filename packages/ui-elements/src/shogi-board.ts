import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  parseSFEN,
  ShogiPiece,
  ShogiHand,
} from "@multi-game-engines/ui-core/shogi";
import { SFEN, createSFEN } from "@multi-game-engines/core/shogi";
import { Move, createMove } from "@multi-game-engines/core";
import { locales } from "@multi-game-engines/i18n";

/**
 * Returns true if the piece belongs to Gote (White).
 * Shogi SFEN uses lowercase for Gote pieces.
 */
function isGotePiece(piece: ShogiPiece): boolean {
  const char = piece.startsWith("+") ? piece[1] : piece;
  return !!char && char === char.toLowerCase();
}

/**
 * A framework-agnostic Shogi board component.
 * @element shogi-board
 */
@customElement("shogi-board")
export class ShogiBoard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 600px;
      user-select: none;
      font-family: serif;
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
    }
    .hand {
      display: flex;
      gap: 5px;
      padding: 5px;
      background: var(--board-hand-bg, #f0d9b5);
      border-radius: 4px;
      font-size: 0.8rem;
      min-height: 1.5rem;
      align-items: center;
    }
    .hand.gote span {
      display: inline-block;
      transform: rotate(180deg);
    }
    .board {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-template-rows: repeat(9, 1fr);
      aspect-ratio: 1 / 1;
      width: 100%;
      border: 1px solid var(--board-border-color, #333);
      background-color: var(--board-bg, #f9f4e8);
    }
    .square {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0.5px solid rgba(0, 0, 0, 0.1);
      font-size: clamp(0.8rem, 6cqi, 2rem);
      position: relative;
    }
    .square.highlight {
      background-color: var(--board-highlight-color, rgba(255, 255, 0, 0.4));
    }
    .piece {
      cursor: default;
    }
    .piece.gote {
      transform: rotate(180deg);
    }
    .error-overlay {
      color: #ef4444;
      font-weight: bold;
      text-align: center;
      padding: 20px;
    }
  `;

  private _sfen: SFEN = createSFEN(
    "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
  );

  /**
   * Current position in SFEN format.
   */
  @property({ type: String, reflect: true })
  get sfen(): SFEN {
    return this._sfen;
  }

  set sfen(value: string) {
    const old = this._sfen;
    this._sfen = createSFEN(value);
    this.requestUpdate("sfen", old);
  }

  private _lastMove: Move | "" = "";

  /**
   * Last move to highlight (e.g., "7g7f" or "P*5e").
   */
  @property({ type: String, attribute: "last-move", reflect: true })
  get lastMove(): Move | "" {
    return this._lastMove;
  }

  set lastMove(value: string) {
    const old = this._lastMove;
    this._lastMove = value === "" ? "" : createMove(value);
    this.requestUpdate("lastMove", old);
  }

  /**
   * Current locale for default labels.
   */
  @property({ type: String })
  locale = "en";

  /**
   * Accessible labels.
   */
  @property({ type: String, attribute: "board-label", reflect: true })
  boardLabel = "";
  @property({ type: String, attribute: "hand-sente-label", reflect: true })
  handSenteLabel = "";
  @property({ type: String, attribute: "hand-gote-label", reflect: true })
  handGoteLabel = "";

  /**
   * Error message to display when position parsing fails.
   */
  @property({ type: String, attribute: "error-message", reflect: true })
  errorMessage = "";

  /**
   * Custom piece names for accessibility (aria-labels).
   */
  @property({ type: Object })
  pieceNames: Partial<Record<ShogiPiece, string>> = {};

  private _getLocalizedStrings() {
    const data = this.locale === "ja" ? locales.ja : locales.en;
    return {
      boardLabel: this.boardLabel || data.dashboard.gameBoard.title,
      handSenteLabel: this.handSenteLabel || data.dashboard.gameBoard.handSente,
      handGoteLabel: this.handGoteLabel || data.dashboard.gameBoard.handGote,
      errorMessage:
        this.errorMessage || data.dashboard.gameBoard.invalidPosition,
      pieceNames: data.dashboard.gameBoard.shogiPieces as Record<
        ShogiPiece,
        string
      >,
      handPieceCount: data.dashboard.gameBoard.handPieceCount,
      squareLabel: (f: number, r: number) =>
        data.dashboard.gameBoard.squareLabel
          .replace("{file}", String(f))
          .replace("{rank}", String(r)),
      squarePieceLabel: (f: number, r: number, p: string) =>
        data.dashboard.gameBoard.squarePieceLabel
          .replace("{file}", String(f))
          .replace("{rank}", String(r))
          .replace("{piece}", p),
    };
  }

  private _getSquareIndex(usi: string): number {
    if (!usi || usi.length < 2 || usi.includes("*")) return -1;
    const fileChar = usi[0];
    const rankChar = usi[1];
    if (!fileChar || !rankChar) return -1;

    const file = 9 - parseInt(fileChar, 10);
    const rank = rankChar.charCodeAt(0) - 97; // a=0...
    if (file < 0 || file >= 9 || rank < 0 || rank >= 9) return -1;
    return rank * 9 + file;
  }

  override render() {
    const strings = this._getLocalizedStrings();
    let board: (ShogiPiece | null)[][] = [];
    let hand: ShogiHand = {
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

    try {
      ({ board, hand } = parseSFEN(this.sfen));
    } catch {
      return html`
        <div class="container" role="alert">
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
    for (let r = 0; r < 9; r++) {
      for (let f = 0; f < 9; f++) {
        const squareIdx = r * 9 + f;
        const piece = board[r]?.[f];
        const isHighlighted = highlightedSquares.has(squareIdx);
        const isGote = piece && isGotePiece(piece);
        // USI coordinate: file (9-1), rank (a-i)
        const usiFile = 9 - f;
        // const usiRank = String.fromCharCode(97 + r); // Not used in display loop but valid

        // Localization: 1-9 for files, 1-9 for ranks
        const displayFile = usiFile;
        const displayRank = r + 1;

        const pieceLabel = piece
          ? this.pieceNames[piece] || strings.pieceNames[piece]
          : "";

        const ariaLabel = piece
          ? strings.squarePieceLabel(displayFile, displayRank, pieceLabel)
          : strings.squareLabel(displayFile, displayRank);

        squares.push(html`
          <div
            class="square ${isHighlighted ? "highlight" : ""}"
            data-square="${usiFile}${String.fromCharCode(97 + r)}"
            role="gridcell"
            aria-label="${ariaLabel}"
          >
            ${piece
              ? html`
                  <span
                    class="piece ${isGote ? "gote" : ""}"
                    role="img"
                    aria-hidden="true"
                  >
                    ${pieceLabel}
                  </span>
                `
              : ""}
          </div>
        `);
      }
    }

    return html`
      <div class="container">
        <div class="hand gote" aria-label="${strings.handGoteLabel}">
          ${this._renderHand(hand, "gote", strings)}
        </div>
        <div class="board" role="grid" aria-label="${strings.boardLabel}">
          ${squares}
        </div>
        <div class="hand sente" aria-label="${strings.handSenteLabel}">
          ${this._renderHand(hand, "sente", strings)}
        </div>
      </div>
    `;
  }

  private _renderHand(
    hand: ShogiHand,
    side: "sente" | "gote",
    strings: ReturnType<typeof this._getLocalizedStrings>,
  ) {
    const pieces =
      side === "sente"
        ? (["R", "B", "G", "S", "N", "L", "P"] as const)
        : (["r", "b", "g", "s", "n", "l", "p"] as const);

    return pieces.map((p) => {
      const count = hand[p];
      if (count === 0) return null;
      const label = this.pieceNames[p as ShogiPiece] || strings.pieceNames[p];
      const ariaLabel =
        count > 1
          ? strings.handPieceCount
              .replace("{piece}", label)
              .replace("{count}", String(count))
          : label;
      return html`<span title="${label}" aria-label="${ariaLabel}"
        >${label}${count > 1 ? count : ""}</span
      >`;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "shogi-board": ShogiBoard;
  }
}
