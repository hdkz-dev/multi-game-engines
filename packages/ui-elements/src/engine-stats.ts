import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchStatistics, createUIStrings } from "@multi-game-engines/ui-core";
import { locales } from "@multi-game-engines/i18n";

@customElement("engine-stats")
export class EngineStatsElement extends LitElement {
  static styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 1rem;
      background-color: #f9fafb;
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
      color: #6b7280;
      font-weight: 500;
    }
    .value {
      font-size: 0.875rem;
      font-weight: 700;
      color: #111827;
      font-family: ui-monospace, monospace;
    }
  `;

  @property({ type: Object }) stats?: SearchStatistics;
  @property({ type: String }) locale = "ja";

  private _formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  }

  render() {
    if (!this.stats) return html``;
    const strings = createUIStrings(
      this.locale === "ja" ? locales.ja : locales.en,
    );

    return html`
      <div class="stat-box">
        <span class="label">${strings.depth}</span>
        <span class="value"
          >${this.stats.depth}${this.stats.seldepth
            ? `/${this.stats.seldepth}`
            : ""}</span
        >
      </div>
      <div class="stat-box">
        <span class="label">${strings.nodes}</span>
        <span class="value">${this._formatNumber(this.stats.nodes)}</span>
      </div>
      <div class="stat-box">
        <span class="label">${strings.nps}</span>
        <span class="value">${this._formatNumber(this.stats.nps)}</span>
      </div>
      <div class="stat-box">
        <span class="label">${strings.time}</span>
        <span class="value"
          >${(this.stats.time / 1000).toFixed(
            1,
          )}${strings.timeUnitSeconds}</span
        >
      </div>
    `;
  }
}
