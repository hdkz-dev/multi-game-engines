import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchStatistics,
  createUIStrings,
  formatNumber,
  formatTime, } from "@multi-game-engines/ui-core";
import { commonLocales } from "@multi-game-engines/i18n-common";

@customElement("engine-stats")
export class EngineStatsElement extends LitElement {
  static styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 1rem;
      background-color: var(--mge-surface-alt);
      border-radius: 0.5rem;
    }
    @media (min-width: 768px) {
      :host {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .stat-box {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .label {
      font-size: 0.75rem;
      color: var(--mge-color-gray-500);
      font-weight: 500;
    }
    .value {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--mge-color-gray-900);
      font-family: var(--mge-font-mono);
    }
  `;

  @property({ type: Object }) stats?: SearchStatistics;
  @property({ type: String }) locale = "ja";

  render() {
    if (!this.stats) return html``;
    const strings = createUIStrings(
      this.locale === "ja" ? commonLocales.ja : commonLocales.en,
    );

    return html`
      <div class="stat-box">
        <span class="label"
          >${this.stats.visits && this.stats.visits > 0
            ? strings.visits
            : strings.depth}</span
        >
        <span class="value">
          ${this.stats.visits && this.stats.visits > 0
            ? html`${formatNumber(this.stats.visits)}${strings.visitsUnit}`
            : html`${this.stats.depth}${this.stats.seldepth
                ? `/${this.stats.seldepth}`
                : ""}`}
        </span>
      </div>
      <div class="stat-box">
        <span class="label">${strings.nodes}</span>
        <span class="value">${formatNumber(this.stats.nodes)}</span>
      </div>
      <div class="stat-box">
        <span class="label">${strings.nps}</span>
        <span class="value">${formatNumber(this.stats.nps)}</span>
      </div>
      <div class="stat-box">
        <span class="label">${strings.time}</span>
        <span class="value"
          >${formatTime(this.stats.time)}${strings.timeUnitSeconds}</span
        >
      </div>
    `;
  }
}
