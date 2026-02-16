import React from "react";
import {
  EvaluationScore,
  EvaluationPresenter,
} from "@multi-game-engines/ui-core";
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

    // 2026 Best Practice: ロジックを ui-core の EvaluationPresenter へ委譲
    const colorClass = EvaluationPresenter.getColorClass(score, inverted);
    const displayValue = inverted ? -value : value;

    const label =
      type === "mate"
        ? strings.mateIn(Math.abs(displayValue))
        : EvaluationPresenter.getDisplayLabel(score, inverted);

    const ariaLabel =
      type === "mate"
        ? strings.mateIn(Math.abs(displayValue))
        : strings.advantage(
            EvaluationPresenter.getAdvantageSide(value, inverted),
            Math.abs(displayValue),
          );

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset transition-all ${colorClass} ${className}`}
        aria-label={ariaLabel}
        role="status"
      >
        {label}
      </span>
    );
  },
);
