import React from "react";
import {
  SearchStatistics,
  EngineUIStrings,
  formatNumber,
  formatTime,
} from "@multi-game-engines/ui-core";
import { Gauge, Cpu, Layers, Timer } from "lucide-react";
import { cn } from "../utils/cn.js";
import { useEngineUI } from "@multi-game-engines/ui-react-core";

interface EngineStatsProps {
  stats: SearchStatistics;
  className?: string;
  strings?: EngineUIStrings;
}

/**
 * 探索の統計情報（Depth, Nodes, NPS, Time）を表示するコンポーネント。
 */
export const EngineStats: React.FC<EngineStatsProps> = React.memo(
  ({ stats, className, strings: propStrings }) => {
    const { strings: contextStrings } = useEngineUI();
    const strings = propStrings || contextStrings;

    return (
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg",
          className,
        )}
      >
        {stats.visits && stats.visits > 0 ? (
          <StatBox
            icon={<Layers className="w-4 h-4" />}
            label={strings.visits}
            value={`${formatNumber(stats.visits)}${strings.visitsUnit}`}
          />
        ) : (
          <StatBox
            icon={<Layers className="w-4 h-4" />}
            label={strings.depth}
            value={`${stats.depth}${stats.seldepth ? `/${stats.seldepth}` : ""}`}
          />
        )}
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
          value={`${formatTime(stats.time)}${strings.timeUnitSeconds}`}
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
