import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  EvaluationScore,
  EvaluationPresenter,
  createUIStrings,
} from "@multi-game-engines/ui-core";
import { locales } from "@multi-game-engines/i18n";

/**
 * 評価値を表示するカスタム要素 <score-badge>
 */
@customElement("score-badge")
export class ScoreBadgeElement extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      transition: all 0.2s ease-in-out;
      line-height: 1.25rem;
    }
    /* 2026 Best Practice: グローバル・デザイントークンの適用 */
    .bg-score-plus {
      background-color: var(--mge-color-score-plus);
      color: white;
      box-shadow: var(--mge-glow-plus);
    }
    .bg-score-minus {
      background-color: var(--mge-color-score-minus);
      color: white;
      box-shadow: var(--mge-glow-minus);
    }
    .bg-score-mate {
      background-color: var(--mge-color-score-mate);
      color: white;
    }
    .bg-score-neutral {
      background-color: var(--mge-color-score-neutral);
      color: var(--mge-color-score-neutral-text);
    }
    .bg-red-600 {
      background-color: #dc2626;
      color: white;
    }
  `;

  @property({ type: Object }) score?: EvaluationScore;
  @property({ type: Boolean }) inverted = false;
  @property({ type: String }) locale = "ja";

  render() {
    if (!this.score) return html``;

    const strings = createUIStrings(
      this.locale === "ja" ? locales.ja : locales.en,
    );
    const colorClass = EvaluationPresenter.getColorClass(
      this.score,
      this.inverted,
    );

    const displayValue = this.inverted ? -this.score.value : this.score.value;
    const label =
      this.score.type === "mate"
        ? strings.mateIn(Math.abs(displayValue))
        : EvaluationPresenter.getDisplayLabel(this.score, this.inverted);

    const ariaLabel =
      this.score.type === "mate"
        ? strings.mateIn(Math.abs(displayValue))
        : strings.advantage(
            EvaluationPresenter.getAdvantageSide(
              this.score.value,
              this.inverted,
            ),
            Math.abs(displayValue),
          );

    return html`
      <span class="badge ${colorClass}" aria-label="${ariaLabel}" role="status">
        ${label}
      </span>
    `;
  }
}
