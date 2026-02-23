import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  PrincipalVariation,
  createUIStrings,
} from "@multi-game-engines/ui-core";
import { locales } from "@multi-game-engines/i18n";
import "./score-badge.js";

@customElement("pv-list")
export class PVListElement extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .pv-item {
      display: flex;
      flex-direction: column;
      padding: 0.75rem;
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: border-color 0.2s;
    }
    .pv-item:hover {
      border-color: #93c5fd;
    }
    .pv-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .multipv {
      font-size: 0.75rem;
      font-weight: 700;
      color: #9ca3af;
    }
    .moves {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      font-family: ui-monospace, monospace;
      font-size: 0.875rem;
    }
    button {
      padding: 0 0.25rem;
      border-radius: 0.25rem;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #4b5563;
      transition: all 0.2s;
    }
    button:hover {
      background-color: #dbeafe;
      color: #1d4ed8;
    }
    .best-move {
      font-weight: 700;
    }
    .empty {
      padding: 2rem 0;
      text-align: center;
      color: #9ca3af;
      font-style: italic;
      font-size: 0.875rem;
    }
  `;

  @property({ type: Array }) pvs: PrincipalVariation[] = [];
  @property({ type: String }) locale = "ja";

  render() {
    const strings = createUIStrings(
      this.locale === "ja" ? locales.ja : locales.en,
    );

    if (this.pvs.length === 0) {
      return html`<div class="empty">${strings.searching}</div>`;
    }

    return html`
      ${this.pvs.map(
        (pv) => html`
          <div class="pv-item">
            <div class="pv-header">
              <span class="multipv">#${pv.multipv}</span>
              <score-badge
                .score="${pv.score}"
                .locale="${this.locale}"
              ></score-badge>
            </div>
            <div class="moves">
              ${pv.moves.map(
                (move, idx) => html`
                  <button
                    class="${idx === 0 ? "best-move" : ""}"
                    @click="${() =>
                      this.dispatchEvent(
                        new CustomEvent("move-click", {
                          detail: { move: move.toString(), index: idx, pv },
                          bubbles: true,
                          composed: true,
                        }),
                      )}"
                    aria-label="${strings.moveAriaLabel(move.toString())}"
                  >
                    ${move}
                  </button>
                `,
              )}
            </div>
          </div>
        `,
      )}
    `;
  }
}
