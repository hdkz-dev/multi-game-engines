"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { getBridge } from "@/lib/engines";
import { createFEN } from "@multi-game-engines/core";
import { createSFEN } from "@multi-game-engines/adapter-yaneuraou";
import { locales } from "@multi-game-engines/i18n";

const EngineMonitorPanel = dynamic(
  () =>
    import("@multi-game-engines/ui-react").then(
      (mod) => mod.EngineMonitorPanel,
    ),
  { ssr: false },
);
const EngineUIProvider = dynamic(
  () =>
    import("@multi-game-engines/ui-react").then((mod) => mod.EngineUIProvider),
  { ssr: false },
);
const ChessBoard = dynamic(
  () => import("@multi-game-engines/ui-react").then((mod) => mod.ChessBoard),
  { ssr: false },
);
const ShogiBoard = dynamic(
  () => import("@multi-game-engines/ui-react").then((mod) => mod.ShogiBoard),
  { ssr: false },
);

import {
  LayoutGrid,
  Sword,
  Trophy,
  Zap,
  Globe,
  Cpu,
  Gauge,
} from "lucide-react";
import { useEngineMonitor } from "@multi-game-engines/ui-react/hooks";

type EngineType = "chess" | "shogi";
type LocaleType = "ja" | "en";

export default function Dashboard() {
  const [activeEngine, setActiveEngine] = useState<EngineType>("chess");
  const [locale, setLocale] = useState<LocaleType>("ja");
  const bridge = useMemo(() => getBridge(), []);

  const localeData = useMemo(
    () => (locale === "ja" ? locales.ja : locales.en),
    [locale],
  );

  // チェス用の設定
  const chessEngine = useMemo(() => bridge?.getEngine("stockfish"), [bridge]);
  const chessOptions = useMemo(
    () => ({
      fen: createFEN(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ),
      multipv: 3,
    }),
    [],
  );
  const { state: chessState } = useEngineMonitor(chessEngine);

  // 将棋用の設定
  const shogiEngine = useMemo(() => bridge?.getEngine("yaneuraou"), [bridge]);
  const shogiOptions = useMemo(
    () => ({
      sfen: createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
      ),
      multipv: 2,
    }),
    [],
  );
  const { state: shogiState } = useEngineMonitor(shogiEngine);

  const chessBestMove = useMemo(
    () => chessState.pvs[0]?.moves[0],
    [chessState.pvs],
  );
  const shogiBestMove = useMemo(
    () => shogiState.pvs[0]?.moves[0],
    [shogiState.pvs],
  );

  const nps = useMemo(() => {
    const stats =
      activeEngine === "chess" ? chessState.stats : shogiState.stats;
    return stats.nps ? `${(stats.nps / 1000).toFixed(1)}k` : "0";
  }, [activeEngine, chessState.stats, shogiState.stats]);

  if (!bridge || !chessEngine || !shogiEngine) return null;

  return (
    <EngineUIProvider localeData={localeData}>
      <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/30">
        {/* Header Area */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                <LayoutGrid className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              {localeData.dashboard.title}
            </h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-[0.2em] ml-1">
              {localeData.dashboard.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Language Switcher */}
            <div className="flex bg-white shadow-sm border border-gray-200 p-1 rounded-full items-center">
              <Globe
                className="w-4 h-4 ml-2 text-gray-400"
                aria-hidden="true"
              />
              <button
                onClick={() => setLocale("en")}
                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all ${
                  locale === "en"
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("ja")}
                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all ${
                  locale === "ja"
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                JA
              </button>
            </div>

            {/* Engine Switcher */}
            <nav
              className="flex bg-white shadow-sm border border-gray-200 p-1 rounded-xl"
              aria-label={localeData.dashboard.engineSelector}
            >
              <button
                onClick={() => setActiveEngine("chess")}
                aria-pressed={activeEngine === "chess"}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black transition-all ${
                  activeEngine === "chess"
                    ? "bg-blue-600 shadow-md shadow-blue-200 text-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Trophy
                  className={`w-4 h-4 ${activeEngine === "chess" ? "animate-bounce" : ""}`}
                  aria-hidden="true"
                />
                {localeData.dashboard.chessLabel}
              </button>
              <button
                onClick={() => setActiveEngine("shogi")}
                aria-pressed={activeEngine === "shogi"}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black transition-all ${
                  activeEngine === "shogi"
                    ? "bg-blue-600 shadow-md shadow-blue-200 text-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Sword
                  className={`w-4 h-4 ${activeEngine === "shogi" ? "animate-bounce" : ""}`}
                  aria-hidden="true"
                />
                {localeData.dashboard.shogiLabel}
              </button>
            </nav>
          </div>
        </header>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={<Zap className="text-yellow-500 w-5 h-5" />}
            label={localeData.dashboard.stats.engineRuntime.label}
            value={nps}
            sub={localeData.engine.npsUnit}
          />
          <StatCard
            icon={<Cpu className="text-blue-500 w-5 h-5" />}
            label={localeData.dashboard.stats.hardware.label}
            value={localeData.dashboard.stats.hardware.value}
            sub={localeData.dashboard.stats.hardware.sub}
          />
          <StatCard
            icon={<Gauge className="text-green-500 w-5 h-5" />}
            label={localeData.dashboard.stats.performance.label}
            value={localeData.dashboard.stats.performance.value}
            sub={localeData.dashboard.stats.performance.sub}
          />
          <StatCard
            icon={<Trophy className="text-purple-500 w-5 h-5" />}
            label={localeData.dashboard.stats.accessibility.label}
            value={localeData.dashboard.stats.accessibility.value}
            sub={localeData.dashboard.stats.accessibility.sub}
          />
        </div>

        {/* Main Analysis Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 xl:col-span-3 h-full min-h-[600px]">
            {activeEngine === "chess" && (
              <EngineMonitorPanel
                key="chess-panel"
                engine={chessEngine}
                searchOptions={chessOptions}
                title={localeData.engine.stockfishTitle || "Stockfish 16.1"}
                className="h-full"
              />
            )}
            {activeEngine === "shogi" && (
              <EngineMonitorPanel
                key="shogi-panel"
                engine={shogiEngine}
                searchOptions={shogiOptions}
                title={localeData.engine.yaneuraouTitle || "Yaneuraou 7.5.0"}
                className="h-full"
              />
            )}
          </div>

          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Game Board Area */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl shadow-gray-200/50 aspect-video flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

              <div className="w-full max-w-md aspect-square bg-white rounded-xl shadow-inner flex items-center justify-center relative p-4">
                {activeEngine === "chess" ? (
                  <ChessBoard
                    fen={chessOptions.fen}
                    lastMove={chessBestMove}
                    className="w-full h-full"
                    boardLabel={localeData.dashboard.gameBoard.title}
                  />
                ) : (
                  <ShogiBoard
                    sfen={shogiOptions.sfen}
                    lastMove={shogiBestMove}
                    className="w-full h-full"
                    boardLabel={localeData.dashboard.gameBoard.title}
                    handSenteLabel={localeData.dashboard.gameBoard.handSente}
                    handGoteLabel={localeData.dashboard.gameBoard.handGote}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  {localeData.dashboard.technicalInsight.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {localeData.dashboard.technicalInsight.description}
                </p>
              </div>
              <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">
                  {localeData.dashboard.zenithFeatures.title}
                </h3>
                <ul className="text-sm space-y-3">
                  <li className="flex items-center gap-3 text-white/80 font-bold">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-green-500" />
                    </div>
                    {localeData.dashboard.zenithFeatures.multiPv}
                  </li>
                  <li className="flex items-center gap-3 text-white/80 font-bold">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-green-500" />
                    </div>
                    {localeData.dashboard.zenithFeatures.reactiveState}
                  </li>
                  <li className="flex items-center gap-3 text-white/80 font-bold">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-green-500" />
                    </div>
                    {localeData.dashboard.zenithFeatures.contractUi}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </EngineUIProvider>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
      <div className="p-3 bg-gray-50 rounded-xl text-gray-700">{icon}</div>
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
}
