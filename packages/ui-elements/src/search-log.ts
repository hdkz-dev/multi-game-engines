import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import {
  SearchLogEntry,
  createUIStrings,
  formatNumber,
  formatTime,
} from "@multi-game-engines/ui-core";
import { locales } from "@multi-game-engines/i18n";
import "./score-badge.js";

@customElement("search-log")
export class SearchLogElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: 1px solid var(--mge-border-base);
      border-radius: 0.5rem;
      background-color: var(--mge-surface-base);
      overflow-y: auto;
      max-height: 400px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-family: var(--mge-font-mono);
      font-size: 0.75rem;
    }
    thead {
      background-color: var(--mge-surface-alt);
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: var(--mge-shadow-sm);
    }
    th {
      padding: 0.5rem;
      text-align: left;
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--mge-color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--mge-border-base);
    }
    td {
      padding: 0.5rem;
      border-bottom: 1px solid var(--mge-surface-alt);
      vertical-align: middle;
    }
    tbody tr:hover {
      background-color: #eff6ff; /* Keep subtle hover or add token */
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .text-left {
      text-align: left;
    }

    .col-depth {
      width: 3rem;
      color: var(--mge-color-gray-400);
      font-weight: 500;
    }
    .col-score {
      width: 5rem;
    }
    .col-time {
      width: 4rem;
      color: var(--mge-color-gray-500);
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
    }
    .col-nodes {
      width: 4rem;
      color: var(--mge-color-gray-500);
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
    }
    .col-nps {
      width: 4rem;
      color: var(--mge-color-gray-500);
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
    }
    .col-pv {
      width: auto;
    }

    .pv-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      height: 1.25rem;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .seldepth {
      font-size: 9px;
      color: var(--mge-color-gray-300);
    }
    tr:hover .seldepth {
      color: var(--mge-color-gray-400);
    }

    button {
      padding: 0 0.125rem;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--mge-color-gray-500);
      font-size: 0.75rem;
      font-family: inherit;
      border-radius: 0.125rem;
    }
    button:hover {
      color: var(--mge-color-primary);
      text-decoration: underline;
    }
    button:focus {
      outline: 2px solid #3b82f6;
    }
    .best-move {
      font-weight: 700;
      color: var(--mge-color-gray-900);
    }
    .empty {
      padding: 2rem 0;
      text-align: center;
      color: var(--mge-color-gray-400);
      font-style: italic;
    }
    .score-wrapper {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `;

  @property({ type: Array }) log: SearchLogEntry[] = [];
  @property({ type: String }) locale = "ja";
  @property({ type: Boolean }) autoScroll = true;

  @query(":host") container?: HTMLElement;
  private _isNearBottom = true;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "grid");
    this.addEventListener("scroll", this._handleScroll);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("scroll", this._handleScroll);
  }

  private _handleScroll = () => {
    // Smart Auto-Scroll logic
    const { scrollTop, scrollHeight, clientHeight } = this;
    this._isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
  };

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("locale") || !this.hasAttribute("aria-label")) {
      const strings = createUIStrings(
        this.locale === "ja" ? locales.ja : locales.en,
      );
      this.setAttribute("aria-label", strings.searchLog || "Search Log");
    }
    if (this.autoScroll && changedProperties.has("log")) {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    // Only auto-scroll if user is already at the bottom or log is empty
    if (this._isNearBottom || this.log.length === 0) {
      this.scrollTop = this.scrollHeight;
    }
  }

  render() {
    const strings = createUIStrings(
      this.locale === "ja" ? locales.ja : locales.en,
    );

    return html`
      <table>
        <caption class="sr-only">
          ${strings.searchLog}
        </caption>
        <thead>
          <tr>
            <th scope="col" class="col-depth text-center">
              ${strings.depth || "D"}
            </th>
            <th scope="col" class="col-score text-center">
              ${strings.score || "Score"}
            </th>
            <th scope="col" class="col-time text-right">
              ${strings.time || "Time"}
            </th>
            <th scope="col" class="col-nodes text-right">
              ${strings.nodes || "Nodes"}
            </th>
            <th scope="col" class="col-nps text-right">
              ${strings.nps || "NPS"}
            </th>
            <th scope="col" class="col-pv text-left">${strings.pv || "PV"}</th>
          </tr>
        </thead>
        <tbody>
          ${this.log.length === 0
            ? html`
                <tr>
                  <td colspan="6" class="empty">
                    ${strings.searching || "Searching..."}
                  </td>
                </tr>
              `
            : this.log.map(
                (entry, index) => html`
                  <tr role="row" aria-rowindex="${index + 1}">
                    <td class="col-depth text-center">
                      ${entry.visits
                        ? html`<span title="Visits"
                            >${formatNumber(entry.visits)}v</span
                          >`
                        : html`${entry.depth}${entry.seldepth
                            ? html`<span class="seldepth"
                                >/${entry.seldepth}</span
                              >`
                            : ""}`}
                    </td>
                    <td class="col-score">
                      <div class="score-wrapper">
                        <score-badge
                          .score="${entry.score}"
                          .locale="${this.locale}"
                        ></score-badge>
                      </div>
                    </td>
                    <td class="col-time text-right">
                      ${formatTime(entry.time)}${strings.timeUnitSeconds}
                    </td>
                    <td class="col-nodes text-right">
                      ${formatNumber(entry.nodes)}
                    </td>
                    <td class="col-nps text-right">
                      ${formatNumber(entry.nps)}
                    </td>
                    <td class="col-pv">
                      <div class="pv-container">
                        ${entry.pv.map(
                          (move, idx) => html`
                            <button
                              class="${idx === 0 ? "best-move" : ""}"
                              @click="${() =>
                                this.dispatchEvent(
                                  new CustomEvent("move-click", {
                                    detail: { move: move.toString() },
                                    bubbles: true,
                                    composed: true,
                                  }),
                                )}"
                              aria-label="${strings.moveAriaLabel(
                                move.toString(),
                              )}"
                            >
                              ${move}
                            </button>
                          `,
                        )}
                      </div>
                    </td>
                  </tr>
                `,
              )}
        </tbody>
      </table>
    `;
  }
}
