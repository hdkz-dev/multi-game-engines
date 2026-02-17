import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { parseSFEN, ShogiPiece, ShogiHand } from "@multi-game-engines/ui-core";

// Shogi piece mapping to Kanji/Unicode
const PIECE_LABELS: Record<ShogiPiece, string> = {
  P: "歩",
  L: "香",
  N: "桂",
  S: "銀",
  G: "金",
  B: "角",
  R: "飛",
  K: "玉",
  p: "歩",
  l: "香",
  n: "桂",
  s: "銀",
  g: "金",
  b: "角",
  r: "飛",
  k: "王",
  "+P": "と",
  "+L": "杏",
  "+N": "圭",
  "+S": "全",
  "+B": "馬",
  "+R": "龍",
  "+p": "と",
  "+l": "杏",
  "+n": "圭",
  "+s": "全",
  "+b": "馬",
  "+r": "龍",
};

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
      background: #f0d9b5;
      border-radius: 4px;
      font-size: 0.8rem;
      min-height: 1.5rem;
    }
    .board {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-template-rows: repeat(9, 1fr);
      aspect-ratio: 1 / 1;
      width: 100%;
      border: 1px solid #333;
      background-color: #f9f4e8;
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
      background-color: rgba(255, 255, 0, 0.4);
    }
    .piece {
      cursor: default;
    }
    .piece.gote {
      transform: rotate(180deg);
    }
  `;

  /**
   * Current position in SFEN format.
   */
  @property({ type: String })
  sfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";

  /**
   * Last move to highlight (e.g., "7g7f").
   */
  @property({ type: String, attribute: "last-move" })
  lastMove = "";

  private _getSquareIndex(usi: string): number {
    if (usi === "0000" || usi.includes("*")) return -1;
    const file = 9 - parseInt(usi[0]!, 10);
    const rank = usi.charCodeAt(1) - 97; // a=0...
    return rank * 9 + file;
  }

  override render() {
    const { board, hand } = parseSFEN(this.sfen);
    const highlightedSquares = new Set<number>();

    if (this.lastMove && this.lastMove.length >= 4) {
      highlightedSquares.add(this._getSquareIndex(this.lastMove.slice(0, 2)));
      highlightedSquares.add(this._getSquareIndex(this.lastMove.slice(2, 4)));
    }

    const squares = [];
    for (let r = 0; r < 9; r++) {
      for (let f = 0; f < 9; f++) {
        const squareIdx = r * 9 + f;
        const piece = board[r]?.[f];
        const isHighlighted = highlightedSquares.has(squareIdx);
        const isGote = piece && piece.toLowerCase() === piece;

        squares.push(html`
          <div class="square ${isHighlighted ? "highlight" : ""}">
            ${piece
              ? html`
                  <span
                    class="piece ${isGote ? "gote" : ""}"
                    role="img"
                    aria-label="${piece}"
                  >
                    ${PIECE_LABELS[piece]}
                  </span>
                `
              : ""}
          </div>
        `);
      }
    }

    return html`
      <div class="container">
        <div class="hand gote" aria-label="Gote Hand">
          ${this._renderHand(hand, "gote")}
        </div>
        <div class="board" role="grid" aria-label="Shogi Board">${squares}</div>
        <div class="hand sente" aria-label="Sente Hand">
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
      return html`<span
        >${PIECE_LABELS[p as ShogiPiece]}${count > 1 ? count : ""}</span
      >`;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "shogi-board": ShogiBoard;
  }
}
