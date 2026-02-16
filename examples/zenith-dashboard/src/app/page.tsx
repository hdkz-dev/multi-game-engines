"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { getBridge } from "@/lib/engines";
import { createPositionString } from "@multi-game-engines/core";

const EngineMonitorPanel = dynamic(
  () =>
    import("@multi-game-engines/ui-react").then(
      (mod) => mod.EngineMonitorPanel,
    ),
  { ssr: false },
);
import { LayoutGrid, Sword, Trophy, Zap } from "lucide-react";

type EngineType = "chess" | "shogi";

export default function Dashboard() {
  const [activeEngine, setActiveEngine] = useState<EngineType>("chess");
  const bridge = useMemo(() => getBridge(), []);

  // チェス用の設定
  const chessEngine = useMemo(() => bridge?.getEngine("stockfish"), [bridge]);
  const chessOptions = useMemo(
    () => ({
      fen: createPositionString(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }),
    [],
  );

  // 将棋用の設定
  const shogiEngine = useMemo(() => bridge?.getEngine("yaneuraou"), [bridge]);
  const shogiOptions = useMemo(
    () => ({
      sfen: createPositionString(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
      ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }),
    [],
  );

  if (!bridge) return null;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-8 h-8 text-blue-500" />
            ZENITH <span className="text-blue-500">DASHBOARD</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            2026 Zenith Tier Multi-Game Engine Analysis
          </p>
        </div>

        <nav
          className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg"
          aria-label="Engine selector"
        >
          <button
            onClick={() => setActiveEngine("chess")}
            aria-pressed={activeEngine === "chess"}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
              activeEngine === "chess"
                ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Trophy className="w-4 h-4" />
            CHESS
          </button>
          <button
            onClick={() => setActiveEngine("shogi")}
            aria-pressed={activeEngine === "shogi"}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
              activeEngine === "shogi"
                ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Sword className="w-4 h-4" />
            SHOGI
          </button>
        </nav>
      </header>

      {/* Stats Cards (Mocked for Demo) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Environment
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            WASM SIMD + Threads
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <LayoutGrid className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Protocol
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white uppercase">
            {activeEngine === "chess" ? "UCI 16.1" : "USI 7.5.0"}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              UI Quality
            </span>
          </div>
          <div className="text-lg font-bold text-blue-500">
            Zenith Tier (AA)
          </div>
        </div>
      </div>

      {/* Main Analysis Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 xl:col-span-3">
          {activeEngine === "chess" && chessEngine && (
            <EngineMonitorPanel
              engine={chessEngine}
              searchOptions={chessOptions}
              title="Stockfish 16.1"
            />
          )}
          {activeEngine === "shogi" && shogiEngine && (
            <EngineMonitorPanel
              engine={shogiEngine}
              searchOptions={shogiOptions}
              title="Yaneuraou 7.5.0"
            />
          )}
        </div>

        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl aspect-video flex items-center justify-center border-4 border-dashed border-gray-300 dark:border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 font-bold">GAME BOARD AREA</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">
                Placeholder for {activeEngine}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                Deep Analysis Context
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                This dashboard demonstrates the seamless integration of
                disparate game engines. Using the{" "}
                <strong>Multi-Game Engines Core</strong>, protocols are unified,
                while the
                <strong>UI React</strong> package ensures a consistent,
                accessible experience across all engines.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                Zenith Features
              </h3>
              <ul className="text-sm space-y-2 font-medium">
                <li className="flex items-center gap-2 text-green-500">
                  <span className="w-1.5 h-1.5 bg-current rounded-full" />{" "}
                  Dependency Injection WASM
                </li>
                <li className="flex items-center gap-2 text-green-500">
                  <span className="w-1.5 h-1.5 bg-current rounded-full" />{" "}
                  Atomic Handshake Ready
                </li>
                <li className="flex items-center gap-2 text-green-500">
                  <span className="w-1.5 h-1.5 bg-current rounded-full" />{" "}
                  Reactive Core State
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
