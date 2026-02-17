import { EvaluationScore, IEvaluationHistoryEntry } from "./types.js";

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

    if (type === "winrate") {
      if (displayValue > 0.6)
        return "bg-score-plus text-white ring-score-plus/20";
      if (displayValue < 0.4)
        return "bg-score-minus text-white ring-score-minus/20";
      return "bg-score-neutral text-gray-800 ring-gray-200";
    }

    const threshold = type === "points" ? 1.0 : 100;

    if (displayValue > threshold)
      return "bg-score-plus text-white ring-score-plus/20";
    if (displayValue < -threshold)
      return "bg-score-minus text-white ring-score-minus/20";
    return "bg-score-neutral text-gray-800 ring-gray-200";
  },

  /**
   * 表示用の数値ラベルを生成する。
   */
  getDisplayLabel(
    score: EvaluationScore,
    inverted: boolean = false,
    matePrefix: string = "M",
  ): string {
    const { type, value } = score;
    const displayValue = inverted ? -value : value;

    if (type === "mate") {
      return `${matePrefix}${Math.abs(displayValue)}`;
    }

    if (type === "winrate") {
      return `${(displayValue * 100).toFixed(1)}%`;
    }

    if (type === "points") {
      const formatted = displayValue.toFixed(1);
      return displayValue > 0 ? `+${formatted}` : formatted;
    }

    const formatted = (displayValue / 100).toFixed(2);
    if (displayValue >= 0) {
      return `+${formatted}`;
    }
    return formatted; // Negative numbers are handled by toFixed
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

  /**
   * グラフ描画用の座標計算。
   */
  getGraphPoints(
    entries: IEvaluationHistoryEntry[],
    width: number,
    height: number,
    maxAbsScore = 1000,
  ): { x: number; y: number }[] {
    if (entries.length === 0) return [];

    const xStep = width / Math.max(1, entries.length - 1);
    const centerY = height / 2;

    return entries.map((entry, i) => {
      const x = i * xStep;
      const y = (() => {
        if (entry.score.type === "mate") {
          return entry.score.value > 0 ? 0 : height;
        }
        const normalized = Math.max(
          -1,
          Math.min(1, entry.score.value / maxAbsScore),
        );
        return centerY - (normalized * height) / 2;
      })();

      return { x, y };
    });
  },
};
