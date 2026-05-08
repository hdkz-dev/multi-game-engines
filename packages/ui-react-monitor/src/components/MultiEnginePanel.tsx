"use client";

import React, { useId, memo } from "react";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { EvaluationPresenter } from "@multi-game-engines/ui-core";
import { useEngineMonitor } from "../useEngineMonitor.js";
import { EngineMonitorPanel } from "./EngineMonitorPanel.js";
import { cn } from "../utils/cn.js";

export interface EngineEntry<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>;
  label?: string;
  searchOptions: T_OPTIONS;
}

export interface MultiEnginePanelProps<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  engines: EngineEntry<T_OPTIONS, T_INFO, T_RESULT>[];
  /** 個別パネルのクラス */
  panelClassName?: string;
  /** ラッパー全体のクラス */
  className?: string;
  onMoveClick?: (move: string, engineId: string) => void;
}

/**
 * 複数エンジンの思考状況を横並びで表示する統合パネル。
 *
 * 上部にスコア比較バーを表示し、各エンジンの評価値を
 * 一目で比較できます。
 */
export function MultiEnginePanel<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
>({
  engines,
  panelClassName,
  className,
  onMoveClick,
}: MultiEnginePanelProps<T_OPTIONS, T_INFO, T_RESULT>) {
  const headingId = useId();

  if (engines.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4", className)}
    >
      <h2 id={headingId} className="sr-only">
        Multi-Engine Analysis
      </h2>

      {/* Score comparison bar */}
      <ScoreComparisonBar engines={engines} />

      {/* Individual engine panels */}
      <div
        className={cn(
          "grid gap-4",
          engines.length === 1 && "grid-cols-1",
          engines.length === 2 && "grid-cols-1 md:grid-cols-2",
          engines.length >= 3 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        )}
        role="list"
        aria-label="Engine panels"
      >
        {engines.map((entry) => (
          <div key={entry.engine.id} role="listitem">
            <EngineMonitorPanel
              engine={entry.engine}
              searchOptions={entry.searchOptions}
              title={entry.label ?? entry.engine.name}
              {...(panelClassName !== undefined && {
                className: panelClassName,
              })}
              {...(onMoveClick !== undefined && {
                onMoveClick: (move: string) =>
                  onMoveClick(move, entry.engine.id),
              })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Internal: ScoreComparisonBar
// ---------------------------------------------------------------------------

interface ScoreComparisonBarProps<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  engines: EngineEntry<T_OPTIONS, T_INFO, T_RESULT>[];
}

function ScoreComparisonBar<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
>({ engines }: ScoreComparisonBarProps<T_OPTIONS, T_INFO, T_RESULT>) {
  return (
    <div
      className="flex items-stretch gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl overflow-x-auto"
      role="group"
      aria-label="Score comparison"
    >
      {engines.map((entry, idx) => (
        <React.Fragment key={entry.engine.id}>
          {idx > 0 && (
            <div
              className="w-px bg-gray-200 flex-shrink-0 self-stretch"
              aria-hidden="true"
            />
          )}
          <EngineScoreSummary
            engine={entry.engine}
            label={entry.label ?? entry.engine.name}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal: EngineScoreSummary — subscribes to a single engine's state
// ---------------------------------------------------------------------------

interface EngineScoreSummaryProps<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>;
  label: string;
}

const EngineScoreSummary = memo(function EngineScoreSummaryInner<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
>({ engine, label }: EngineScoreSummaryProps<T_OPTIONS, T_INFO, T_RESULT>) {
  const { state, status } = useEngineMonitor(engine);
  const score = state.pvs[0]?.score ?? null;

  const colorClass = score
    ? EvaluationPresenter.getColorClass(score, false)
    : "text-gray-400";

  const displayText = score
    ? EvaluationPresenter.getDisplayLabel(score, false)
    : "—";

  const statusDot =
    status === "busy"
      ? "bg-blue-500 animate-pulse"
      : status === "ready"
        ? "bg-green-500"
        : status === "error"
          ? "bg-red-500"
          : "bg-gray-300";

  return (
    <div
      className="flex flex-col items-center gap-1 min-w-[80px] px-2"
      aria-label={`${label}: ${displayText}`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDot)}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">
          {label}
        </span>
      </div>
      <span
        className={cn(
          "text-lg font-bold tabular-nums leading-tight",
          colorClass,
        )}
        aria-live="polite"
      >
        {displayText}
      </span>
      {state.stats.depth > 0 && (
        <span className="text-xs text-gray-400">d{state.stats.depth}</span>
      )}
    </div>
  );
}) as <
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
>(
  props: EngineScoreSummaryProps<T_OPTIONS, T_INFO, T_RESULT>,
) => React.ReactElement | null;
