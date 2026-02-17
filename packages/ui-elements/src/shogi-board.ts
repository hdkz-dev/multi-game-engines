import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  parseSFEN,
  ShogiPiece,
  ShogiHand,
  SFEN,
} from "@multi-game-engines/ui-core";
import { createSFEN } from "@multi-game-engines/core";

// Shogi piece mapping to Kanji/Labels for display and accessibility
const PIECE_LABELS: Record<ShogiPiece, string> = {
  P: "歩",
  L: "香",
  N: "桂",
  S: "銀",
  G: "金",
  B: "角",
  R: "飛",
  K: "玉",
  p: "後手 歩",
  l: "後手 香",
  n: "後手 桂",
  s: "後手 銀",
  g: "後手 金",
  b: "後手 角",
  r: "後手 飛",
  k: "後手 王",
  "+P": "と金",
  "+L": "成香",
  "+N": "成桂",
  "+S": "成銀",
  "+B": "龍馬",
  "+R": "龍王",
  "+p": "後手 と金",
  "+l": "後手 成香",
  "+n": "後手 成桂",
  "+s": "後手 成銀",
  "+b": "後手 龍馬",
  "+r": "後手 龍王",
};

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

  /**
   * Current position in SFEN format.
   */
  @property({ type: String, reflect: true })
  sfen: SFEN = createSFEN(
    "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
  );

  /**
   * Last move to highlight (e.g., "7g7f" or "P*5e").
   */
  @property({ type: String, attribute: "last-move", reflect: true })
  lastMove = "";

  /**
   * Accessible labels.
   */
  @property({ type: String, attribute: "board-label", reflect: true })
  boardLabel = "Shogi Board";
  @property({ type: String, attribute: "hand-sente-label", reflect: true })
  handSenteLabel = "Sente Hand";
  @property({ type: String, attribute: "hand-gote-label", reflect: true })
  handGoteLabel = "Gote Hand";

  /**
   * Error message to display when position parsing fails.
   */
  @property({ type: String, attribute: "error-message", reflect: true })
  errorMessage = "Invalid Position";

  /**
   * Custom piece names for accessibility (aria-labels).
   */
  @property({ type: Object })
  pieceNames: Partial<Record<ShogiPiece, string>> = {};

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
          <div class="error-overlay">${this.errorMessage}</div>
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
        const usiRank = String.fromCharCode(97 + r);

        const label = piece
          ? this.pieceNames[piece] || PIECE_LABELS[piece]
          : "";

        squares.push(html`
          <div
            class="square ${isHighlighted ? "highlight" : ""}"
            data-square="${usiFile}${usiRank}"
          >
            ${piece
              ? html`
                  <span
                    class="piece ${isGote ? "gote" : ""}"
                    role="img"
                    aria-label="${label}"
                  >
                    ${label}
                  </span>
                `
              : ""}
          </div>
        `);
      }
    }

    return html`
      <div class="container">
        <div class="hand gote" aria-label="${this.handGoteLabel}">
          ${this._renderHand(hand, "gote")}
        </div>
        <div class="board" role="grid" aria-label="${this.boardLabel}">
          ${squares}
        </div>
        <div class="hand sente" aria-label="${this.handSenteLabel}">
          ${this._renderHand(hand, "sente")}
        </div>
      </div>
    `;
  }

  private _renderHand(hand: ShogiHand, side: "sente" | "gote") {
    const pieces =
      side === "sente"
        ? (["R", "B", "G", "S", "N", "L", "P"] as const)
        : (["r", "b", "g", "s", "n", "l", "p"] as const);

    return pieces.map((p) => {
      const count = hand[p];
      if (count === 0) return null;
      const label =
        this.pieceNames[p as ShogiPiece] || PIECE_LABELS[p as ShogiPiece];
      return html`<span title="${label}"
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
