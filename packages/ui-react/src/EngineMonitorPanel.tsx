"use client";

import React, { useMemo } from "react";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { useEngineMonitor } from "./useEngineMonitor.js";
import { EngineStats } from "./EngineStats.js";
import { PVList } from "./PVList.js";
import { ScoreBadge } from "./ScoreBadge.js";
import { EvaluationGraph } from "./EvaluationGraph.js";
import { useEngineUI } from "./EngineUIProvider.js";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Separator from "@radix-ui/react-separator";
import { Play, Square, Settings2, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EngineMonitorPanelProps<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>;
  searchOptions: T_OPTIONS;
  title?: string;
  className?: string;
  onMoveClick?: (move: string) => void;
}

/**
 * 思考状況を統合的に表示・制御するメインパネルコンポーネント。
 */
export function EngineMonitorPanel<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
>({
  engine,
  searchOptions,
  title,
  className,
  onMoveClick,
}: EngineMonitorPanelProps<T_OPTIONS, T_INFO, T_RESULT>) {
  const { strings } = useEngineUI();
  const { state, status, search, stop } = useEngineMonitor(engine);

  const bestPV = state.pvs[0];
  const displayTitle = title ?? strings.title;

  // 2026 Best Practice: IEngine インターフェースの公式 API を使用して型安全にイベント発行
  const emitUIInteraction = (action: string) => {
    engine.emitTelemetry({
      type: "lifecycle",
      timestamp: Date.now(),
      metadata: {
        component: "EngineMonitorPanel",
        action,
        engineId: engine.id,
      },
    });
  };

  const handleStart = () => {
    emitUIInteraction("start_click");
    void search(searchOptions);
  };

  const handleStop = () => {
    emitUIInteraction("stop_click");
    void stop();
  };

  // アクセシビリティ用：重要なステータス変更のアナウンス
  const announcement = useMemo(() => {
    if (status === "error") return strings.errorTitle;
    if (bestPV?.score.type === "mate")
      return strings.mateIn(bestPV.score.value);
    return "";
  }, [status, bestPV, strings]);

  return (
    <section
      className={cn(
        "flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg focus-within:ring-2 focus-within:ring-blue-500/20 transition-shadow",
        className,
      )}
      aria-labelledby="engine-monitor-title"
    >
      <div className="sr-only" aria-live="assertive" role="alert">
        {announcement}
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <h2
            id="engine-monitor-title"
            className="font-bold text-gray-700 text-sm"
          >
            {displayTitle}
          </h2>
          <span
            className={cn(
              "w-2 h-2 rounded-full ml-1",
              status === "busy" ? "bg-red-500 animate-pulse" : "bg-green-500",
              "motion-reduce:animate-none",
            )}
            role="presentation"
          />
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
            {status === "busy" ? strings.searching : strings.ready}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === "busy" ? (
            <button
              onClick={handleStop}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-bold hover:bg-red-600 hover:text-white transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-2 outline-none active:scale-95"
              aria-label={strings.stop}
            >
              <Square className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">{strings.stop}</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-600 hover:text-white transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none active:scale-95"
              aria-label={strings.start}
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">{strings.start}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {status === "error" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-red-500 bg-red-50/30">
            <AlertCircle className="w-12 h-12 mb-4 animate-bounce" />
            <h3 className="font-bold mb-1">{strings.errorTitle}</h3>
            <p className="text-xs text-red-400 max-w-[240px]">
              {engine.lastError?.remediation || strings.errorDefaultRemediation}
            </p>
          </div>
        ) : (
          <>
            <section className="p-4 bg-gradient-to-br from-white to-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  {strings.topCandidate}
                </span>
                {bestPV && (
                  <ScoreBadge
                    score={bestPV.score}
                    className="scale-110 origin-right"
                  />
                )}
              </div>
              <div className="text-xl font-mono font-black text-gray-900 truncate leading-tight tracking-tighter">
                {bestPV?.moves[0]?.toString() || strings.noMove}
              </div>
            </section>

            {/* Evaluation Trend Graph */}
            <div className="px-4 py-2 bg-white">
              {/* <EvaluationGraph
                entries={state.evaluationHistory.entries}
                height={40}
                className="opacity-80 hover:opacity-100 transition-opacity"
              /> */}
            </div>

            <Separator.Root className="h-[1px] bg-gray-100" />

            <EngineStats
              stats={state.stats}
              className="rounded-none bg-white border-none py-3"
            />

            <Separator.Root className="h-[1px] bg-gray-100" />

            <div className="flex-1 min-h-0 flex flex-col">
              <div className="px-4 py-2 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  {strings.principalVariations}
                </h3>
                <span className="text-[10px] font-mono text-gray-300">
                  {strings.pvCount(state.pvs.length)}
                </span>
              </div>
              <ScrollArea.Root className="flex-1 overflow-hidden">
                <ScrollArea.Viewport className="h-full w-full p-4">
                  <PVList
                    pvs={state.pvs}
                    onMoveClick={(m) => onMoveClick?.(m)}
                  />
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                  className="flex select-none touch-none p-0.5 bg-gray-100/50 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2"
                  orientation="vertical"
                >
                  <ScrollArea.Thumb className="flex-1 bg-gray-300 rounded-full relative" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </div>
          </>
        )}
      </div>

      <footer className="px-4 py-2 bg-gray-50/80 border-t border-gray-200 text-[9px] text-gray-400 flex justify-between font-medium">
        <span className="truncate mr-4">
          {strings.engineVersion(engine.name, engine.version)}
        </span>
        <span className="flex-shrink-0">
          {strings.engineBridgeStandard(2026)}
        </span>
      </footer>
    </section>
  );
}
