import React from "react";
import { PrincipalVariation } from "@multi-game-engines/ui-core";
import { ScoreBadge } from "./ScoreBadge.js";
import { useEngineUI } from "./EngineUIProvider.js";
import { cn } from "./utils/cn.js";

interface PVListProps {
  pvs: PrincipalVariation[];
  onMoveClick?:
    | ((move: string, index: number, pv: PrincipalVariation) => void)
    | undefined;
  className?: string | undefined;
}

/**
 * エンジンの読み筋（Principal Variations）を一覧表示するコンポーネント。
 */
export const PVList: React.FC<PVListProps> = React.memo(
  ({ pvs, onMoveClick, className }) => {
    const { strings } = useEngineUI();

    return (
      <div className={cn("space-y-2", className)}>
        {pvs.map((pv) => (
          <div
            key={pv.multipv}
            className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">
                  #{pv.multipv}
                </span>
                <ScoreBadge score={pv.score} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1 font-mono text-sm leading-relaxed">
              {pv.moves.map((move, idx) => (
                <button
                  key={`${pv.multipv}-${idx}-${move}`}
                  onClick={() => onMoveClick?.(move.toString(), idx, pv)}
                  className={cn(
                    "px-1 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer",
                    idx === 0 ? "font-bold" : "text-gray-600",
                  )}
                >
                  {move.toString()}
                </button>
              ))}
            </div>
          </div>
        ))}

        {pvs.length === 0 && (
          <div className="py-8 text-center text-gray-400 italic text-sm">
            {strings.searching}
          </div>
        )}
      </div>
    );
  },
);
