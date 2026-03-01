"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { getBridge } from "@/lib/engines";
import {
  createFEN,
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
  FEN,
} from "@multi-game-engines/domain-chess";
import {
  createSFEN,
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
  SFEN,
} from "@multi-game-engines/domain-shogi";
import { IEngine, EngineBridge, Move } from "@multi-game-engines/core";
import { commonLocales } from "@multi-game-engines/i18n-common";
import { dashboardLocales } from "@multi-game-engines/i18n-dashboard";
import { formatNumber } from "@multi-game-engines/ui-core";

const EngineMonitorPanel = dynamic(
  () =>
    import("@multi-game-engines/ui-react-monitor").then(
      (mod) => mod.EngineMonitorPanel,
    ),
  { ssr: false },
);

const ChessBoard = dynamic(
  () =>
    import("@multi-game-engines/ui-chess-react").then((mod) => mod.ChessBoard),
  { ssr: false },
);

const ShogiBoard = dynamic(
  () =>
    import("@multi-game-engines/ui-shogi-react").then((mod) => mod.ShogiBoard),
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

enum EngineType {
  CHESS = "chess",
  SHOGI = "shogi",
}

const CHESS_MULTI_PV = 3;
const SHOGI_MULTI_PV = 3;

/**
 * 2026 Zenith Tier: 再帰的な Record 型による Zero-Any ポリシーの遵守。
 */
type DeepRecord = {
  [key: string]: string | number | boolean | DeepRecord | undefined;
};

/**
 * 2026 Zenith Tier: i18n キーへの動的アクセスを許可するための型定義。
 */
interface DashboardLocale {
  dashboard: DeepRecord;
  engine: DeepRecord;
}

/**
 * Renders the Zenith Hybrid Analysis Dashboard UI and manages engine initialization and state.
 *
 * Initializes a bridge and loads both chess and shogi engines, presents loading and error states while initializing, and displays interactive controls to switch locale and active engine, live engine monitoring, and game boards once engines are ready.
 *
 * @returns The rendered dashboard JSX element containing header controls, hero stats, engine monitor panel, and game board/insights.
 */
export default function Dashboard() {
  const [activeEngine, setActiveEngine] = useState<EngineType>(
    EngineType.CHESS,
  );
  const [locale, setLocale] = useState("ja");
  const [bridge, setBridge] = useState<EngineBridge | null>(null);
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

    const initEngines = async () => {
      const bridgeInstance = await getBridge();
      if (!bridgeInstance) return;

      if (isMounted) {
        setBridge(bridgeInstance);
      }

      try {
        const [chess, shogi] = await Promise.all([
          bridgeInstance.getEngine<
            IChessSearchOptions,
            IChessSearchInfo,
            IChessSearchResult
          >({
            id: "stockfish",
            adapter: "stockfish",
            sources: {
              main: {
                url: "/mock-stockfish.js",
                sri: "sha384-2CA0XC0DuF44TijPmnyH+96/9A0CQ7smsVy4Cc6U7j7dKy8gZlRnIEw2mGAEu+jm",
                type: "worker-js",
              },
              wasm: {
                url: "/mock-stockfish.wasm",
                sri: "sha384-2CA0XC0DuF44TijPmnyH+96/9A0CQ7smsVy4Cc6U7j7dKy8gZlRnIEw2mGAEu+jm",
                type: "wasm",
              },
            },
          }),
          bridgeInstance.getEngine<
            IShogiSearchOptions,
            IShogiSearchInfo,
            IShogiSearchResult
          >({ id: "yaneuraou", adapter: "yaneuraou" }),
        ]);

        if (isMounted) {
          setChessEngine(chess);
          setShogiEngine(shogi);
        }
      } catch (error) {
        console.error("Failed to initialize engines:", error);
        if (isMounted) {
          setInitError(
            error instanceof Error ? error.message : "Initialization Failed",
          );
        }
      }
    };

    void initEngines();

    document.title = "Zenith Hybrid Analysis Dashboard";

    return () => {
      isMounted = false;
    };
  }, []);

  const localeData = useMemo(() => {
    const base = (
      locale === "ja" ? commonLocales.ja : commonLocales.en
    ) as Record<string, Record<string, unknown>>;
    const extra = (
      locale === "ja" ? dashboardLocales.ja : dashboardLocales.en
    ) as Record<string, Record<string, unknown>>;
    return {
      dashboard: {
        ...((base["dashboard"] as Record<string, unknown>) || {}),
        ...((extra["dashboard"] as Record<string, unknown>) || {}),
      },
      engine: {
        ...((base["engine"] as Record<string, unknown>) || {}),
        ...((extra["engine"] as Record<string, unknown>) || {}),
      },
    } as unknown as DashboardLocale;
  }, [locale]);

  // チェス用の設定
  const chessOptions = useMemo(
    () => ({
      initialPosition: createFEN(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ),
      multipv: CHESS_MULTI_PV,
      depth: 20,
    }),
    [],
  );

  const { state: chessState } = useEngineMonitor(chessEngine, chessOptions);

  // 将棋用の設定
  const shogiOptions = useMemo(
    () => ({
      initialPosition: createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
      ),
      multipv: SHOGI_MULTI_PV,
    }),
    [],
  );

  const { state: shogiState } = useEngineMonitor(shogiEngine, shogiOptions);

  const chessBestMove = useMemo(
    () => (chessState.pvs[0] ? chessState.pvs[0].moves[0] : null),
    [chessState.pvs],
  );

  const shogiBestMove = useMemo(
    () => (shogiState.pvs[0] ? shogiState.pvs[0].moves[0] : null),
    [shogiState.pvs],
  );

  const stats =
    activeEngine === EngineType.CHESS ? chessState.stats : shogiState.stats;
  const npsValue = (stats as unknown as Record<string, unknown>).nps as number;
  const npsLabel = useMemo(() => formatNumber(npsValue), [npsValue]);

  if (initError || !bridge || !chessEngine || !shogiEngine) {
    const dashboardStrings = localeData.dashboard;
    return (
      <EngineUIProvider>
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-[#111] border border-white/5 rounded-3xl p-8 text-center shadow-2xl">
              {initError ? (
                <>
                  <Zap className="w-8 h-8 mx-auto mb-3 text-red-500 animate-pulse" />
                  <p className="font-black tracking-tighter text-lg mb-1">
                    {dashboardStrings.initializationFailed as string}
                  </p>
                  <p className="text-xs font-bold opacity-70 leading-relaxed">
                    {initError === "__INITIALIZATION_FAILED__"
                      ? ((dashboardStrings["errors"] as DeepRecord)
                          ?.bridgeNotAvailable as string)
                      : initError}
                  </p>
                </>
              ) : (
                <>
                  <Globe className="w-8 h-8 mx-auto mb-3 text-blue-500 animate-spin-slow" />
                  <p className="font-black tracking-tighter text-lg animate-pulse">
                    {dashboardStrings.initializingEngines as string}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </EngineUIProvider>
    );
  }

  const d = localeData.dashboard;
  const e = localeData.engine;

  return (
    <EngineUIProvider>
      <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans selection:bg-blue-500/30">
        {/* Header */}
        <header className="px-8 py-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-6 backdrop-blur-md sticky top-0 z-50 bg-[#0a0a0a]/80">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">
                {d.title as string}
              </h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                {d.subtitle as string}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#111] p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setLocale(locale === "ja" ? "en" : "ja")}
              className="px-4 py-2 rounded-xl text-xs font-black transition-all hover:bg-white/5 flex items-center gap-2"
              aria-label={d.languageSelector as string}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              {locale === "ja"
                ? ((d.language as DeepRecord)?.en as string)
                : ((d.language as DeepRecord)?.ja as string)}
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            <button
              onClick={() =>
                setActiveEngine(
                  activeEngine === EngineType.CHESS
                    ? EngineType.SHOGI
                    : EngineType.CHESS,
                )
              }
              className="px-4 py-2 rounded-xl text-xs font-black transition-all bg-blue-600 text-white shadow-lg shadow-blue-600/20 flex items-center gap-2"
              aria-label={d.engineSelector as string}
            >
              <Sword className="w-3.5 h-3.5" />
              {activeEngine === EngineType.CHESS
                ? (d.shogiLabel as string)
                : (d.chessLabel as string)}
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Zap className="w-5 h-5 text-yellow-400" />}
              label={
                ((d.stats as DeepRecord)?.engineRuntime as DeepRecord)
                  ?.label as string
              }
              value={
                ((d.stats as DeepRecord)?.engineRuntime as DeepRecord)
                  ?.value as string
              }
              sub={
                ((d.stats as DeepRecord)?.engineRuntime as DeepRecord)
                  ?.sub as string
              }
            />
            <StatCard
              icon={<Cpu className="w-5 h-5 text-purple-400" />}
              label={
                ((d.stats as DeepRecord)?.hardware as DeepRecord)
                  ?.label as string
              }
              value={
                ((d.stats as DeepRecord)?.hardware as DeepRecord)
                  ?.value as string
              }
              sub={
                ((d.stats as DeepRecord)?.hardware as DeepRecord)?.sub as string
              }
            />
            <StatCard
              icon={<Gauge className="w-5 h-5 text-blue-400" />}
              label={
                ((d.stats as DeepRecord)?.performance as DeepRecord)
                  ?.label as string
              }
              value={npsLabel}
              sub={
                ((d.stats as DeepRecord)?.performance as DeepRecord)
                  ?.sub as string
              }
            />
            <StatCard
              icon={<Trophy className="w-5 h-5 text-pink-400" />}
              label={
                ((d.stats as DeepRecord)?.accessibility as DeepRecord)
                  ?.label as string
              }
              value={
                ((d.stats as DeepRecord)?.accessibility as DeepRecord)
                  ?.value as string
              }
              sub={
                ((d.stats as DeepRecord)?.accessibility as DeepRecord)
                  ?.sub as string
              }
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Monitor Panel */}
            <div className="xl:col-span-4">
              <EngineMonitorPanel
                engine={
                  activeEngine === EngineType.CHESS ? chessEngine : shogiEngine
                }
                searchOptions={
                  activeEngine === EngineType.CHESS
                    ? chessOptions
                    : shogiOptions
                }
                title={
                  activeEngine === EngineType.CHESS
                    ? (e.stockfishTitle as string)
                    : (e.yaneuraouTitle as string)
                }
              />
            </div>

            {/* Board Area */}
            <div className="xl:col-span-8 space-y-8">
              <div className="bg-[#111] rounded-[2rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter text-white mb-1">
                      {(d.gameBoard as DeepRecord)?.title as string}
                    </h2>
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                      {(d.gameBoard as DeepRecord)?.subtitle as string}
                    </p>
                  </div>
                  <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">
                        {e.topCandidate as string}
                      </span>
                      <span className="text-xl font-mono font-black text-blue-400">
                        {activeEngine === EngineType.CHESS
                          ? chessBestMove?.toString() || "---"
                          : shogiBestMove?.toString() || "---"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-full max-w-[600px] aspect-square relative">
                    {activeEngine === EngineType.CHESS ? (
                      <ChessBoard
                        fen={chessState.position as FEN}
                        lastMove={chessBestMove as Move}
                        locale={locale}
                        className="w-full h-full rounded-xl shadow-2xl"
                        boardLabel={
                          (d.gameBoard as DeepRecord)?.title as string
                        }
                        errorMessage={
                          (d.gameBoard as DeepRecord)?.invalidPosition as string
                        }
                        pieceNames={
                          (d.gameBoard as DeepRecord)?.chessPieces as Record<
                            string,
                            string
                          >
                        }
                      />
                    ) : (
                      <ShogiBoard
                        sfen={shogiState.position as SFEN}
                        lastMove={shogiBestMove as Move}
                        locale={locale}
                        className="w-full h-full rounded-xl shadow-2xl"
                        boardLabel={
                          (d.gameBoard as DeepRecord)?.title as string
                        }
                        errorMessage={
                          (d.gameBoard as DeepRecord)?.invalidPosition as string
                        }
                        pieceNames={
                          (d.gameBoard as DeepRecord)?.shogiPieces as Record<
                            string,
                            string
                          >
                        }
                        handSenteLabel={
                          (d.gameBoard as DeepRecord)?.handSente as string
                        }
                        handGoteLabel={
                          (d.gameBoard as DeepRecord)?.handGote as string
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#111] rounded-[2rem] p-8 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter">
                      {(d.technicalInsight as DeepRecord)?.title as string}
                    </h3>
                  </div>
                  <p className="text-xs font-bold text-white/50 leading-relaxed">
                    {(d.technicalInsight as DeepRecord)?.description as string}
                  </p>
                </div>

                <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-600/10 relative overflow-hidden group">
                  <Zap className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 transition-transform group-hover:scale-110 duration-700" />
                  <h3 className="text-sm font-black uppercase tracking-tighter mb-6 relative z-10">
                    {(d.zenithFeatures as DeepRecord)?.title as string}
                  </h3>
                  <ul className="space-y-4 relative z-10">
                    {[
                      {
                        icon: <Zap className="w-4 h-4" />,
                        label: (d.zenithFeatures as DeepRecord)
                          ?.multiPv as string,
                      },
                      {
                        icon: <Gauge className="w-4 h-4" />,
                        label: (d.zenithFeatures as DeepRecord)
                          ?.reactiveState as string,
                      },
                      {
                        icon: <Cpu className="w-4 h-4" />,
                        label: (d.zenithFeatures as DeepRecord)
                          ?.contractUi as string,
                      },
                    ].map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-xs font-black"
                      >
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                          {feature.icon}
                        </div>
                        {feature.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </EngineUIProvider>
  );
}
