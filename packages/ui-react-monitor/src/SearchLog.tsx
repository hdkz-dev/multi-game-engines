import React, { useRef, useEffect } from "react";
import {
  SearchLogEntry,
  formatNumber,
  formatTime,
} from "@multi-game-engines/ui-core";
import { ScoreBadge } from "./ScoreBadge.js";
import { useEngineUI } from "@multi-game-engines/ui-react-core";
import { cn } from "./utils/cn.js";

interface SearchLogProps {
  log: SearchLogEntry[];
  onMoveClick?: ((move: string) => void) | undefined;
  className?: string | undefined;
  autoScroll?: boolean | undefined;
}

/**
 * エンジンの探索ログ（履歴）をネイティブ HTML テーブル形式で表示するコンポーネント。
 * 2026 Best Practice: ネイティブ要素による堅牢なアクセシビリティ。
 */
export const SearchLog: React.FC<SearchLogProps> = React.memo(
  ({ log, onMoveClick, className, autoScroll = true }) => {
    const { strings } = useEngineUI();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);

    // Smart Auto-Scroll: ユーザーが上にスクロールしている時は勝手にスクロールしない
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // 許容誤差 50px 以内なら「一番下にいる」とみなす
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
    };

    useEffect(() => {
      if (
        autoScroll &&
        scrollRef.current &&
        (isNearBottomRef.current || log.length === 0)
      ) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [log, autoScroll]);

    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="region"
        aria-label={strings.searchLog}
        className={cn(
          "border border-gray-200 rounded-lg bg-white overflow-y-auto max-h-[400px]",
          className,
        )}
      >
        <table className="min-w-full text-xs font-mono border-collapse table-fixed">
          <caption className="sr-only">{strings.searchLog}</caption>
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th
                scope="col"
                className="p-2 w-12 text-center border-b border-gray-200"
              >
                {strings.depth || "D"}
              </th>
              <th
                scope="col"
                className="p-2 w-20 text-center border-b border-gray-200"
              >
                {strings.score || "Score"}
              </th>
              <th
                scope="col"
                className="p-2 w-16 text-right border-b border-gray-200"
              >
                {strings.time || "Time"}
              </th>
              <th
                scope="col"
                className="p-2 w-16 text-right border-b border-gray-200"
              >
                {strings.nodes || "Nodes"}
              </th>
              <th
                scope="col"
                className="p-2 w-16 text-right border-b border-gray-200"
              >
                {strings.nps || "NPS"}
              </th>
              <th
                scope="col"
                className="p-2 text-left border-b border-gray-200 w-auto"
              >
                {strings.pv || "PV"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {log.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-gray-400 italic"
                >
                  {strings.searching || "Searching..."}
                </td>
              </tr>
            ) : (
              log.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-blue-50 transition-colors group"
                >
                  <td className="p-2 text-center text-gray-400 font-medium">
                    {entry.visits ? (
                      <span title={strings.visits}>
                        {formatNumber(entry.visits)}
                        {strings.visitsUnit}
                        <span className="sr-only">{strings.visits}</span>
                      </span>
                    ) : (
                      <>
                        <span className="sr-only">{strings.depth}: </span>
                        {entry.depth}
                        {entry.seldepth ? (
                          <span className="text-[9px] text-gray-300 group-hover:text-gray-400">
                            /{entry.seldepth}
                          </span>
                        ) : (
                          ""
                        )}
                      </>
                    )}
                  </td>
                  <td className="p-2 flex justify-center">
                    <div className="w-full flex justify-center">
                      <ScoreBadge score={entry.score} />
                    </div>
                  </td>
                  <td className="p-2 text-right text-gray-500 tabular-nums">
                    {formatTime(entry.time)}
                    {strings.timeUnitSeconds}
                  </td>
                  <td className="p-2 text-right text-gray-500 tabular-nums">
                    {formatNumber(entry.nodes)}
                  </td>
                  <td className="p-2 text-right text-gray-500 tabular-nums">
                    {formatNumber(entry.nps)}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-x-1 gap-y-0.5 leading-tight">
                      {entry.pv.map((move, idx) => (
                        <button
                          key={`${entry.id}-${idx}-${move}`}
                          onClick={() => onMoveClick?.(move.toString())}
                          className={cn(
                            "hover:text-blue-600 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-0.5 transition-colors",
                            idx === 0
                              ? "font-bold text-gray-900"
                              : "text-gray-500",
                          )}
                          aria-label={strings.moveAriaLabel(move.toString())}
                        >
                          {move.toString()}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  },
);
