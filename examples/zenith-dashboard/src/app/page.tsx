"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { getBridge } from "@/lib/engines";
import { createFEN } from "@multi-game-engines/domain-chess";
import { createSFEN } from "@multi-game-engines/domain-shogi";
import { IEngine } from "@multi-game-engines/core";
import {
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "@multi-game-engines/adapter-uci";
import {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/adapter-usi";
import { locales } from "@multi-game-engines/i18n";
import { formatNumber } from "@multi-game-engines/ui-core";

const EngineMonitorPanel = dynamic(
  () =>
    import("@multi-game-engines/ui-react").then(
      (mod) => mod.EngineMonitorPanel,
    ),
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
import {
  EngineUIProvider,
  useEngineMonitor,
  StatCard,
} from "@multi-game-engines/ui-react";
import { useLocale } from "./layout";

type EngineType = "chess" | "shogi";

const CHESS_MULTI_PV = 3;
const SHOGI_MULTI_PV = 2;

export default function Dashboard() {
  const [activeEngine, setActiveEngine] = useState<EngineType>("chess");
  const { locale, setLocale } = useLocale();
  const bridge = useMemo(() => getBridge(), []);

  const [chessEngine, setChessEngine] = useState<IEngine<
    IChessSearchOptions,
    IChessSearchInfo,
    IChessSearchResult
  > | null>(null);
  const [shogiEngine, setShogiEngine] = useState<IEngine<
    IShogiSearchOptions,
    IShogiSearchInfo,
    IShogiSearchResult
  > | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initEngines() {
      if (!bridge) return;
      try {
        const [chess, shogi] = await Promise.all([
          bridge.getEngine("stockfish"),
          bridge.getEngine("yaneuraou"),
        ]);
        if (isMounted) {
          setChessEngine(chess);
          setShogiEngine(shogi);
        }
      } catch (error) {
        console.error("Engine initialization failed:", error);
        if (isMounted) {
          setInitError(
            error instanceof Error
              ? error.message
              : "__INITIALIZATION_FAILED__",
          );
        }
      }
    }

    void initEngines();

    return () => {
      isMounted = false;
    };
  }, [bridge]);

  const localeData = useMemo(
    () => (locale === "ja" ? locales.ja : locales.en),
    [locale],
  );

  // チェス用の設定
  const chessOptions = useMemo(
    () => ({
      fen: createFEN(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ),
      multipv: CHESS_MULTI_PV,
    }),
    [],
  );
  const { state: chessState } = useEngineMonitor(chessEngine);

  // 将棋用の設定
  const shogiOptions = useMemo(
    () => ({
      sfen: createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
      ),
      multipv: SHOGI_MULTI_PV,
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
    return formatNumber(stats.nps);
  }, [activeEngine, chessState.stats, shogiState.stats]);

  if (initError || !bridge || !chessEngine || !shogiEngine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          {initError ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-3xl border border-red-100 shadow-xl shadow-red-100/50 max-w-sm">
              <Zap className="w-8 h-8 mx-auto mb-3 text-red-500 animate-pulse" />
              <p className="font-black tracking-tighter text-lg mb-1">
                {localeData.dashboard.initializationFailed}
              </p>
              <p className="text-xs font-bold opacity-70 leading-relaxed">
                {initError === "__INITIALIZATION_FAILED__"
                  ? localeData.dashboard.initializationFailed
                  : initError}
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-bold tracking-widest text-sm uppercase">
                {localeData.dashboard.initializingEngines}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

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
            <div
              role="group"
              aria-label={localeData.dashboard.languageSelector}
              className="flex bg-white shadow-sm border border-gray-200 p-1 rounded-full items-center"
            >
              <Globe
                className="w-4 h-4 ml-2 text-gray-400"
                aria-hidden="true"
              />
              <button
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
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
                aria-pressed={locale === "ja"}
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
            icon={<Zap className="w-5 h-5" />}
            iconClass="text-yellow-500"
            label={localeData.dashboard.stats.engineRuntime.label}
            value={nps}
            sub={localeData.engine.npsUnit}
          />
          <StatCard
            icon={<Cpu className="w-5 h-5" />}
            iconClass="text-blue-500"
            label={localeData.dashboard.stats.hardware.label}
            value={localeData.dashboard.stats.hardware.value}
            sub={localeData.dashboard.stats.hardware.sub}
          />
          <StatCard
            icon={<Gauge className="w-5 h-5" />}
            iconClass="text-green-500"
            label={localeData.dashboard.stats.performance.label}
            value={localeData.dashboard.stats.performance.value}
            sub={localeData.dashboard.stats.performance.sub}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            iconClass="text-purple-500"
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
                    errorMessage={
                      localeData.dashboard.gameBoard.invalidPosition
                    }
                    pieceNames={localeData.dashboard.gameBoard.chessPieces}
                  />
                ) : (
                  <ShogiBoard
                    sfen={shogiOptions.sfen}
                    lastMove={shogiBestMove}
                    className="w-full h-full"
                    boardLabel={localeData.dashboard.gameBoard.title}
                    errorMessage={
                      localeData.dashboard.gameBoard.invalidPosition
                    }
                    handSenteLabel={localeData.dashboard.gameBoard.handSente}
                    handGoteLabel={localeData.dashboard.gameBoard.handGote}
                    pieceNames={localeData.dashboard.gameBoard.shogiPieces}
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
