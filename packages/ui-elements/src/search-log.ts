import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
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
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background-color: white;
      overflow-y: auto;
      max-height: 400px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-family: ui-monospace, monospace;
      font-size: 0.75rem;
    }
    thead {
      background-color: #f9fafb;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    th {
      padding: 0.5rem;
      text-align: left;
      font-size: 0.625rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e5e7eb;
    }
    td {
      padding: 0.5rem;
      border-bottom: 1px solid #f9fafb;
      vertical-align: middle;
    }
    tbody tr:hover {
      background-color: #eff6ff;
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
      color: #9ca3af;
      font-weight: 500;
    }
    .col-score {
      width: 5rem;
    }
    .col-time {
      width: 4rem;
      color: #6b7280;
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
    }
    .col-nodes {
      width: 4rem;
      color: #6b7280;
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
    }
    .col-nps {
      width: 4rem;
      color: #6b7280;
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
      color: #d1d5db;
    }
    tr:hover .seldepth {
      color: #9ca3af;
    }

    button {
      padding: 0 0.125rem;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #6b7280;
      font-size: 0.75rem;
      font-family: inherit;
      border-radius: 0.125rem;
    }
    button:hover {
      color: #2563eb;
      text-decoration: underline;
    }
    button:focus {
      outline: 2px solid #3b82f6;
    }
    .best-move {
      font-weight: 700;
      color: #111827;
    }
    .empty {
      padding: 2rem 0;
      text-align: center;
      color: #9ca3af;
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

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "grid");
  }

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
    this.scrollTop = this.scrollHeight;
  }

  render() {
    const strings = createUIStrings(
      this.locale === "ja" ? locales.ja : locales.en,
    );

    return html`
      <table>
        <caption class="sr-only">
          ${strings.searchLog || "Search Log"}
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
                      ${entry.depth}${entry.seldepth
                        ? html`<span class="seldepth">/${entry.seldepth}</span>`
                        : ""}
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
