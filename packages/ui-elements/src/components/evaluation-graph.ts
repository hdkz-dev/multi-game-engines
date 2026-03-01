import { LitElement, html, css, svg } from "lit";
import { customElement, property } from "lit/decorators.js";
import { EvaluationPresenter,
  IEvaluationHistoryEntry,
  createUIStrings, } from "@multi-game-engines/ui-core";
import { commonLocales } from "@multi-game-engines/i18n-common";

@customElement("evaluation-graph")
export class EvaluationGraphElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
      border-radius: 0.25rem;
      background-color: var(--mge-surface-alt);
      padding: 0.25rem;
    }
    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .zero-line {
      stroke: var(--mge-border-base);
      stroke-dasharray: 2, 2;
    }
    .trend-line {
      fill: none;
      stroke: var(--mge-color-primary);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: all 0.3s ease-in-out;
    }
    .last-point {
      fill: var(--mge-color-primary);
    }
  `;

  @property({ type: Array }) entries: IEvaluationHistoryEntry[] = [];
  @property({ type: Number }) height = 60;
  @property({ type: String }) locale = "ja";

  render() {
    const strings = createUIStrings(
      this.locale === "ja" ? commonLocales.ja : commonLocales.en,
    );
    const points = EvaluationPresenter.getGraphPoints(
      this.entries,
      200,
      this.height,
    );
    const pathData =
      points.length < 2
        ? ""
        : `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
    const lastPoint = points.length > 0 ? points[points.length - 1] : null;

    return html`
      <svg
        viewBox="0 0 200 ${this.height}"
        preserveAspectRatio="none"
        aria-label="${strings.evaluationGraph}"
        role="img"
      >
        <!-- ゼロライン -->
        <line
          x1="0"
          y1="${this.height / 2}"
          x2="200"
          y2="${this.height / 2}"
          class="zero-line"
        />

        <!-- 推移ライン -->
        <path d="${pathData}" class="trend-line" />

        <!-- 最新のポイント -->
        ${lastPoint
          ? svg`<circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="3" class="last-point" />`
          : ""}
      </svg>
    `;
  }
}
