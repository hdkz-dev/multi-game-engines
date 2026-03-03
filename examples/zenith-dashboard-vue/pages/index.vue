<script setup lang="ts">
import { ref, computed, onMounted, shallowRef, watch } from "vue";
import {
  EngineMonitorPanel,
  EngineUIProvider,
  ChessBoard,
  ShogiBoard,
} from "@multi-game-engines/ui-vue";
import { useEngineMonitor } from "@multi-game-engines/ui-vue/hooks";
import { commonLocales } from "@multi-game-engines/i18n-common";
import { dashboardLocales } from "@multi-game-engines/i18n-dashboard";
import {
  LayoutGrid,
  Sword,
  Trophy,
  Zap,
  Globe,
  Cpu,
  Gauge,
} from "lucide-vue-next";
import {
  createFEN,
  type IChessSearchOptions,
  type IChessSearchInfo,
  type IChessSearchResult,
} from "@multi-game-engines/domain-chess";
import {
  createSFEN,
  type IShogiSearchOptions,
  type IShogiSearchInfo,
  type IShogiSearchResult,
} from "@multi-game-engines/domain-shogi";
import type { IEngine } from "@multi-game-engines/core";
import { useEngines } from "../composables/useEngines";
import StatCard from "../components/StatCard.vue";

useHead({
  title: "Zenith Hybrid Analysis Dashboard (Vue)",
  meta: [
    {
      name: "description",
      content:
        "High-performance game engine analysis powered by multi-game-engines (Vue 3 + Nuxt 3)",
    },
  ],
});

type EngineType = "chess" | "shogi";
const activeEngine = ref<EngineType>("chess");
const locale = ref("ja");

const localeData = computed(() => {
  const base = locale.value === "ja" ? commonLocales.ja : commonLocales.en;
  const extra =
    locale.value === "ja" ? dashboardLocales.ja : dashboardLocales.en;

  return {
    dashboard: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...((base as any)?.dashboard || {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...((extra as any)?.dashboard || {}),
    },
    engine: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...((base as any)?.engine || {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...((extra as any)?.engine || {}),
    },
  };
});

const { bridge } = useEngines();

// 2026 Zenith: Use shallowRef for engine instances to avoid Proxy corruption
const chessEngine = shallowRef<IEngine<
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult
> | null>(null);
const shogiEngine = shallowRef<IEngine<
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult
> | null>(null);
const initError = ref<string | null>(null);
const isInitializing = ref(false);

const initEngines = async () => {
  if (isInitializing.value || (chessEngine.value && shogiEngine.value)) return;
  isInitializing.value = true;

  const bridgeInstance = bridge.value;
  if (!bridgeInstance) {
    isInitializing.value = false;
    return;
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
            url: `${window.location.origin}/mock-stockfish.js`,
            __unsafeNoSRI: true,
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
            url: `${window.location.origin}/mock-stockfish.js`,
            __unsafeNoSRI: true,
            type: "worker-js",
          },
        },
      }),
    ]);

    chessEngine.value = chess;
    shogiEngine.value = shogi;
  } catch (error) {
    console.error("Failed to initialize engines:", error);
    initError.value =
      error instanceof Error ? error.message : "Initialization Failed";
  } finally {
    isInitializing.value = false;
  }
};

onMounted(() => {
  initEngines();
});

const CHESS_MULTI_PV = 3;
const SHOGI_MULTI_PV = 3;

const chessOptions = computed(() => ({
  fen: createFEN(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ),
  multipv: CHESS_MULTI_PV,
  depth: 20,
}));

const { state: chessState, status: chessEngineStatus } = useEngineMonitor(chessEngine, {
  autoMiddleware: true,
});

watch(chessEngineStatus, (s) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") (window as any).__CHESS_STATUS__ = s;
}, { immediate: true });

const shogiOptions = computed(() => ({
  sfen: createSFEN(
    "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
  ),
  multipv: SHOGI_MULTI_PV,
}));

const { state: shogiState, status: shogiEngineStatus } = useEngineMonitor(shogiEngine, {
  autoMiddleware: true,
});

watch(shogiEngineStatus, (s) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") (window as any).__SHOGI_STATUS__ = s;
}, { immediate: true });

const chessBestMove = computed(() =>
  chessState.value.pvs[0] ? chessState.value.pvs[0].moves[0] : null,
);
const shogiBestMove = computed(() =>
  shogiState.value.pvs[0] ? shogiState.value.pvs[0].moves[0] : null,
);

const chessBoardProps = computed(() => ({
  fen: chessOptions.value.fen,
  lastMove: chessBestMove.value,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  boardLabel: (localeData.value.dashboard as any)?.gameBoard?.title,
}));

const shogiBoardProps = computed(() => ({
  sfen: shogiOptions.value.sfen,
  lastMove: shogiBestMove.value,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  boardLabel: (localeData.value.dashboard as any)?.gameBoard?.title,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handSenteLabel: (localeData.value.dashboard as any)?.gameBoard?.handSente,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handGoteLabel: (localeData.value.dashboard as any)?.gameBoard?.handGote,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pieceNames: (localeData.value.dashboard as any)?.gameBoard?.shogiPieces,
}));

const toggleEngine = () => {
  activeEngine.value = activeEngine.value === "chess" ? "shogi" : "chess";
};

const toggleLocale = () => {
  locale.value = locale.value === "ja" ? "en" : "ja";
};
</script>

<template>
  <EngineUIProvider :locale-data="localeData">
    <ClientOnly>
      <div
        v-if="initError || !bridge || !chessEngine || !shogiEngine"
        class="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6"
      >
        <div class="max-w-md w-full">
          <div
            class="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center"
          >
            <Zap class="w-8 h-8 text-red-500 mx-auto mb-6" />
            <h2 class="text-2xl font-bold mb-2">
              {{ (localeData.dashboard as any)?.initializationFailed || "Initialization Failed" }}
            </h2>
            <p class="text-gray-400 mb-6">{{ initError || "Preparing Engines..." }}</p>
            <button
              class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
              @click="initEngines"
            >
              Retry
            </button>
          </div>
        </div>
      </div>

      <main
        v-else
        class="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans"
      >
        <div class="max-w-7xl mx-auto space-y-8">
          <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <LayoutGrid class="w-12 h-12 text-blue-600" />
              <div>
                <h1 class="text-2xl font-black tracking-tight">
                  {{ (localeData.dashboard as any)?.title }}
                </h1>
                <p class="text-xs font-bold text-blue-500 uppercase">
                  {{ (localeData.dashboard as any)?.subtitle }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                class="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-medium"
                @click="toggleLocale"
              >
                <Globe class="w-3.5 h-3.5 text-blue-400" />
                {{ locale === "ja" ? (localeData.dashboard as any)?.language?.en : (localeData.dashboard as any)?.language?.ja }}
              </button>

              <button
                class="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-medium"
                @click="toggleEngine"
              >
                <Sword class="w-3.5 h-3.5 text-amber-400" />
                {{ activeEngine === "chess" ? (localeData.dashboard as any)?.shogiLabel : (localeData.dashboard as any)?.chessLabel }}
              </button>
            </div>
          </header>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8">
              <div v-if="chessEngine" v-show="activeEngine === 'chess'" class="h-full">
                <EngineMonitorPanel
                  :engine="chessEngine"
                  :search-options="chessOptions"
                  :board-component="ChessBoard"
                  :board-props="chessBoardProps"
                  :title="(localeData.engine as any)?.stockfishTitle"
                />
              </div>
              <div v-if="shogiEngine" v-show="activeEngine === 'shogi'" class="h-full">
                <EngineMonitorPanel
                  :engine="shogiEngine"
                  :search-options="shogiOptions"
                  :board-component="ShogiBoard"
                  :board-props="shogiBoardProps"
                  :title="(localeData.engine as any)?.yaneuraouTitle"
                />
              </div>
            </div>

            <aside class="lg:col-span-4 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <StatCard :icon="Cpu" :label="(localeData.dashboard as any)?.stats?.engineRuntime?.label" :value="(localeData.dashboard as any)?.stats?.engineRuntime?.value" sub="" color="blue" />
                <StatCard :icon="Zap" :label="(localeData.dashboard as any)?.stats?.hardware?.label" :value="(localeData.dashboard as any)?.stats?.hardware?.value" sub="" color="amber" />
                <StatCard :icon="Gauge" :label="(localeData.dashboard as any)?.stats?.performance?.label" :value="(localeData.dashboard as any)?.stats?.performance?.value" sub="" color="emerald" />
                <StatCard :icon="Trophy" :label="(localeData.dashboard as any)?.stats?.accessibility?.label" :value="(localeData.dashboard as any)?.stats?.accessibility?.value" sub="" color="purple" />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </ClientOnly>
  </EngineUIProvider>
</template>
