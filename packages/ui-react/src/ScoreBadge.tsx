import React from "react";
import { EvaluationScore } from "@multi-game-engines/ui-core";
import { useEngineUI } from "./EngineUIProvider.js";

interface ScoreBadgeProps {
  score: EvaluationScore;
  /** 表示を反転させるか（後手視点など） */
  inverted?: boolean;
  className?: string;
}

/**
 * 評価値（cp/mate）を色分けして表示するバッジコンポーネント。
 */
export const ScoreBadge: React.FC<ScoreBadgeProps> = React.memo(
  ({ score, inverted = false, className = "" }) => {
    const { strings } = useEngineUI();
    const { type, value } = score;
    const displayValue = inverted ? -value : value;

    const getColors = () => {
      if (type === "mate") return "bg-score-mate text-white ring-score-mate/20";
      if (displayValue > 100)
        return "bg-score-plus text-white ring-score-plus/20";
      if (displayValue < -100)
        return "bg-score-minus text-white ring-score-minus/20";
      return "bg-score-neutral text-gray-800 ring-gray-200";
    };

    const label =
      type === "mate"
        ? strings.mateIn(Math.abs(value))
        : `${displayValue > 0 ? "+" : ""}${(displayValue / 100).toFixed(2)}`;

    const ariaLabel =
      type === "mate"
        ? strings.mateIn(Math.abs(value))
        : strings.advantage(
            displayValue > 0 ? "plus" : "minus",
            Math.abs(displayValue),
          );

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${getColors()} ${className}`}
        aria-label={ariaLabel}
        role="status"
      >
        {label}
      </span>
    );
  },
);
