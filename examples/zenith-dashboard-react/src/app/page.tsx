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
import {
  IEngine,
  EngineBridge,
  Move,
  createMove,
} from "@multi-game-engines/core";
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

interface DashboardLocaleStat {
  label?: string;
  value?: string;
}

interface DashboardSection {
  title?: string;
  subtitle?: string;
  chessLabel?: string;
  shogiLabel?: string;
  language?: DeepRecord;
  stats?: {
    engineRuntime?: DashboardLocaleStat;
    hardware?: DashboardLocaleStat;
    performance?: DashboardLocaleStat;
    accessibility?: DashboardLocaleStat;
    [key: string]: DashboardLocaleStat | undefined;
  };
  [key: string]:
    | string
    | number
    | boolean
    | DeepRecord
    | DashboardSection["stats"]
    | undefined;
}

/**
 * 2026 Zenith Tier: i18n キーへの動的アクセスを許可するための型定義。
 */
interface DashboardLocale {
  dashboard: DashboardSection;
  engine: DeepRecord;
}

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
        // 2026 Zenith: Ensure absolute URLs for Workers
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const workerUrl = `${baseUrl}/mock-stockfish.js`;

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
                url: workerUrl,
                sri: "sha384-nwQg3G6ZXaGaRYnyPOOVOWDzZaVPk7a1IhSgMskhf7qQnbggdO417fMJoI+xqWlN",
                type: "worker-js",
              },
            },
          }),
          bridgeInstance.getEngine<
            IShogiSearchOptions,
            IShogiSearchInfo,
            IShogiSearchResult
          >({
            id: "yaneuraou",
            adapter: "yaneuraou",
            sources: {
              main: {
                url: workerUrl,
                sri: "sha384-nwQg3G6ZXaGaRYnyPOOVOWDzZaVPk7a1IhSgMskhf7qQnbggdO417fMJoI+xqWlN",
                type: "worker-js",
              },
            },
          }),
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
    return () => {
      isMounted = false;
    };
  }, []);

  const localeData = useMemo((): DashboardLocale => {
    const base = locale === "ja" ? commonLocales.ja : commonLocales.en;
    const extra = locale === "ja" ? dashboardLocales.ja : dashboardLocales.en;
    const baseObj = (
      typeof base === "object" && base !== null ? base : {}
    ) as Record<string, unknown>;
    const extraObj = (
      typeof extra === "object" && extra !== null ? extra : {}
    ) as Record<string, unknown>;
    return {
      dashboard: {
        ...((baseObj.dashboard as DashboardSection) || {}),
        ...((extraObj.dashboard as DashboardSection) || {}),
      },
      engine: {
        ...((baseObj.engine as DeepRecord) || {}),
        ...((extraObj.engine as DeepRecord) || {}),
      },
    };
  }, [locale]);

  const chessOptions = useMemo(
    () => ({
      fen: createFEN(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ),
      multipv: CHESS_MULTI_PV,
      depth: 20,
    }),
    [],
  );

  const { state: chessState } = useEngineMonitor(chessEngine, {
    autoMiddleware: true,
  });

  const shogiOptions = useMemo(
    () => ({
      sfen: createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
      ),
      multipv: SHOGI_MULTI_PV,
    }),
    [],
  );

  const { state: shogiState } = useEngineMonitor(shogiEngine, {
    autoMiddleware: true,
  });

  const chessBestMove = useMemo(
    () => (chessState.pvs[0] ? chessState.pvs[0].moves[0] : null),
    [chessState.pvs],
  );
  const shogiBestMove = useMemo(
    () => (shogiState.pvs[0] ? shogiState.pvs[0].moves[0] : null),
    [shogiState.pvs],
  );

  if (initError || !bridge || !chessEngine || !shogiEngine) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center p-8 bg-[#111] rounded-3xl border border-white/5">
          <Zap className="w-8 h-8 mx-auto mb-4 text-red-500 animate-pulse" />
          <p className="font-bold">{initError || "Preparing Engines..."}</p>
        </div>
      </div>
    );
  }

  const d = localeData.dashboard;
  const e = localeData.engine;

  return (
    <EngineUIProvider locale-data={localeData}>
      <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans">
        <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <LayoutGrid className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-2xl font-black">{d.title as string}</h1>
              <p className="text-[10px] text-white/40 uppercase">
                {d.subtitle as string}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === "ja" ? "en" : "ja")}
              className="px-4 py-2 rounded-xl text-xs font-black bg-white/5 hover:bg-white/10 flex items-center gap-2"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              {locale === "ja"
                ? ((d.language as DeepRecord | undefined)?.en as
                    | string
                    | undefined)
                : ((d.language as DeepRecord | undefined)?.ja as
                    | string
                    | undefined)}
            </button>
            <button
              onClick={() =>
                setActiveEngine(
                  activeEngine === EngineType.CHESS
                    ? EngineType.SHOGI
                    : EngineType.CHESS,
                )
              }
              className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white flex items-center gap-2"
            >
              <Sword className="w-3.5 h-3.5" />
              {activeEngine === EngineType.CHESS
                ? (d.shogiLabel as string)
                : (d.chessLabel as string)}
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Zap className="w-5 h-5 text-yellow-400" />}
              label={d.stats?.engineRuntime?.label ?? ""}
              value={d.stats?.engineRuntime?.value ?? ""}
              sub=""
            />
            <StatCard
              icon={<Cpu className="w-5 h-5 text-purple-400" />}
              label={d.stats?.hardware?.label ?? ""}
              value={d.stats?.hardware?.value ?? ""}
              sub=""
            />
            <StatCard
              icon={<Gauge className="w-5 h-5 text-blue-400" />}
              label={d.stats?.performance?.label ?? ""}
              value={formatNumber(chessState.stats.nps)}
              sub=""
            />
            <StatCard
              icon={<Trophy className="w-5 h-5 text-pink-400" />}
              label={d.stats?.accessibility?.label ?? ""}
              value={d.stats?.accessibility?.value ?? ""}
              sub=""
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-4">
              <div
                style={{
                  display: activeEngine === EngineType.CHESS ? "block" : "none",
                }}
              >
                {chessEngine && (
                  <EngineMonitorPanel
                    engine={chessEngine}
                    searchOptions={chessOptions}
                    title={e.stockfishTitle as string}
                  />
                )}
              </div>
              <div
                style={{
                  display: activeEngine === EngineType.SHOGI ? "block" : "none",
                }}
              >
                {shogiEngine && (
                  <EngineMonitorPanel
                    engine={shogiEngine}
                    searchOptions={shogiOptions}
                    title={e.yaneuraouTitle as string}
                  />
                )}
              </div>
            </div>
            <div className="xl:col-span-8 bg-[#111] rounded-[2rem] p-10 border border-white/5">
              {activeEngine === EngineType.CHESS
                ? chessState.position && (
                    <ChessBoard
                      fen={createFEN(chessState.position)}
                      lastMove={
                        chessBestMove ? createMove(chessBestMove) : undefined
                      }
                      locale={locale}
                      className="w-full max-w-[600px] mx-auto"
                    />
                  )
                : shogiState.position && (
                    <ShogiBoard
                      sfen={createSFEN(shogiState.position)}
                      lastMove={
                        shogiBestMove ? createMove(shogiBestMove) : undefined
                      }
                      locale={locale}
                      className="w-full max-w-[600px] mx-auto"
                    />
                  )}
            </div>
          </div>
        </div>
      </main>
    </EngineUIProvider>
  );
}
