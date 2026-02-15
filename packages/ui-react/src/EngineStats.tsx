import React from "react";
import {
  SearchStatistics,
  EngineUIStrings,
  jaStrings,
} from "@multi-game-engines/ui-core";
import { Gauge, Cpu, Layers, Timer } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EngineStatsProps {
  stats: SearchStatistics;
  className?: string;
  strings?: EngineUIStrings;
}

/**
 * 数値を読みやすい形式にフォーマット (1000 -> 1.0k, 1000000 -> 1.0M)
 */
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

/**
 * 探索の統計情報（Depth, Nodes, NPS, Time）を表示するコンポーネント。
 */
export const EngineStats: React.FC<EngineStatsProps> = React.memo(
  ({ stats, className, strings = jaStrings }) => {
    return (
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg",
          className,
        )}
      >
        <StatBox
          icon={<Layers className="w-4 h-4" />}
          label={strings.depth}
          value={`${stats.depth}${stats.seldepth ? `/${stats.seldepth}` : ""}`}
        />
        <StatBox
          icon={<Cpu className="w-4 h-4" />}
          label={strings.nodes}
          value={formatNumber(stats.nodes)}
        />
        <StatBox
          icon={<Gauge className="w-4 h-4" />}
          label={strings.nps}
          value={`${formatNumber(stats.nps)}`}
        />
        <StatBox
          icon={<Timer className="w-4 h-4" />}
          label={strings.time}
          value={`${(stats.time / 1000).toFixed(1)}${strings.timeUnitSeconds}`}
        />
      </div>
    );
  },
);

const StatBox: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-sm font-bold text-gray-900 font-mono">{value}</div>
  </div>
);
