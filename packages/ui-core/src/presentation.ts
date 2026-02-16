import { EvaluationScore } from "./types.js";

/**
 * 評価値の表示に関する共通ロジックを提供するユーティリティ。
 */
export const EvaluationPresenter = {
  /**
   * 評価値に基づいて CSS クラス名を決定する。
   * React/Vue 両方で同じデザイン・セマンティクスを共有するために使用。
   */
  getColorClass(score: EvaluationScore, inverted: boolean = false): string {
    const { type, value } = score;
    const displayValue = inverted ? -value : value;

    if (type === "mate") {
      return displayValue > 0
        ? "bg-score-mate text-white ring-score-mate/20 shadow-score-mate/30"
        : "bg-red-600 text-white ring-red-200 shadow-red-200/30";
    }

    if (displayValue > 100)
      return "bg-score-plus text-white ring-score-plus/20";
    if (displayValue < -100)
      return "bg-score-minus text-white ring-score-minus/20";
    return "bg-score-neutral text-gray-800 ring-gray-200";
  },

  /**
   * 表示用の数値ラベルを生成する。
   */
  getDisplayLabel(score: EvaluationScore, inverted: boolean = false): string {
    const { type, value } = score;
    const displayValue = inverted ? -value : value;

    if (type === "mate") {
      return `M${Math.abs(displayValue)}`; // i18n 前のフォールバック
    }

    const sign = displayValue > 0 ? "+" : "";
    return `${sign}${(displayValue / 100).toFixed(2)}`;
  },

  /**
   * i18n 用のサイドを決定する。
   */
  getAdvantageSide(
    value: number,
    inverted: boolean = false,
  ): "plus" | "minus" | "neutral" {
    const displayValue = inverted ? -value : value;
    if (displayValue > 0) return "plus";
    if (displayValue < 0) return "minus";
    return "neutral";
  },
};
