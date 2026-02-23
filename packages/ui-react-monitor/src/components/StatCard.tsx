import React from "react";
import { cn } from "../utils/cn.js";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  iconClass?: string;
  className?: string;
}

/**
 * 統計情報を表示するためのカードコンポーネント。
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  sub,
  iconClass,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4",
        className,
      )}
    >
      <div className={cn("p-3 bg-gray-50 rounded-xl", iconClass)}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">
          {value}
        </p>
        <p className="text-[10px] text-gray-400 font-bold italic">{sub}</p>
      </div>
    </div>
  );
};
