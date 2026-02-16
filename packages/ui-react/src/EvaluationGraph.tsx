"use client";

import React, { useMemo } from "react";
import {
  EvaluationPresenter,
  IEvaluationHistoryEntry,
} from "@multi-game-engines/ui-core";

interface EvaluationGraphProps {
  entries: IEvaluationHistoryEntry[];
  width?: number | string;
  height?: number;
  className?: string;
}

/**
 * 評価値の推移を視覚化するグラフコンポーネント。
 */
export const EvaluationGraph: React.FC<EvaluationGraphProps> = ({
  entries,
  width = "100%",
  height = 60,
  className = "",
}) => {
  const points = useMemo(() => {
    // 内部的な計算用に固定幅 200 を使用し、SVG の preserveAspectRatio でリサイズ対応
    return EvaluationPresenter.getGraphPoints(entries, 200, height);
  }, [entries, height]);

  const pathData = useMemo(() => {
    if (points.length < 2) return "";
    return `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  }, [points]);

  return (
    <div
      className={`relative overflow-hidden rounded bg-gray-50/50 p-1 dark:bg-gray-900/50 ${className}`}
      style={{ width, height }}
      aria-label="Evaluation trend graph"
      role="img"
    >
      <svg
        viewBox={`0 0 200 ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* ゼロライン */}
        <line
          x1="0"
          y1={height / 2}
          x2="200"
          y2={height / 2}
          stroke="currentColor"
          className="text-gray-300 dark:text-gray-700"
          strokeDasharray="2,2"
        />

        {/* 推移ライン */}
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500 transition-all duration-300 ease-in-out dark:text-blue-400"
        />

        {/* 最新のポイント */}
        {points.length > 0 && points[points.length - 1] && (
          <circle
            cx={points[points.length - 1]!.x}
            cy={points[points.length - 1]!.y}
            r="3"
            className="fill-blue-500 dark:fill-blue-400"
          />
        )}
      </svg>
    </div>
  );
};
