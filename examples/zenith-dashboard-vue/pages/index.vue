<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from "vue";
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
  const base = (
    locale.value === "ja" ? commonLocales.ja : commonLocales.en
  ) as Record<string, Record<string, unknown>>;
  const extra = (
    locale.value === "ja" ? dashboardLocales.ja : dashboardLocales.en
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
  };
});

const { bridge } = useEngines();

// エンジンインスタンスの保持 (2026: getBridge が非同期のため)
const chessEngine = ref<IEngine<
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult
> | null>(null);
const shogiEngine = ref<IEngine<
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult
> | null>(null);
const initError = ref<string | null>(null);

const initEngines = async () => {
  const bridgeInstance = bridge.value;
  if (!bridgeInstance) return;

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

    chessEngine.value = chess;
    shogiEngine.value = shogi;
  } catch (error) {
    console.error("Failed to initialize engines:", error);
    initError.value =
      error instanceof Error ? error.message : "Initialization Failed";
  }
};

onMounted(() => {
  initEngines();
});

const CHESS_MULTI_PV = 3;
const SHOGI_MULTI_PV = 3;

// チェス用の設定
const chessOptions = {
  initialPosition: createFEN(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ),
  multipv: CHESS_MULTI_PV,
  depth: 20,
};

const { state: chessState } = useEngineMonitor(chessEngine, chessOptions);

// 将棋用の設定
const shogiOptions = {
  initialPosition: createSFEN(
    "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
  ),
  multipv: SHOGI_MULTI_PV,
};

const { state: shogiState } = useEngineMonitor(shogiEngine, shogiOptions);

const chessBestMove = computed(() =>
  chessState.value.pvs[0] ? chessState.value.pvs[0].moves[0] : null,
);

const shogiBestMove = computed(() =>
  shogiState.value.pvs[0] ? shogiState.value.pvs[0].moves[0] : null,
);

const toggleEngine = () => {
  activeEngine.value = activeEngine.value === "chess" ? "shogi" : "chess";
};

const toggleLocale = () => {
  locale.value = locale.value === "ja" ? "en" : "ja";
};

// アイコンのリアクティブな生成（Vue 3 Best Practice）
const icons = {
  zap: markRaw(Zap),
  cpu: markRaw(Cpu),
  gauge: markRaw(Gauge),
  trophy: markRaw(Trophy),
};
</script>

<template>
  <EngineUIProvider>
    <div
      v-if="initError || !bridge || !chessEngine || !shogiEngine"
      class="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6"
    >
      <div class="max-w-md w-full">
        <div
          class="bg-[#111] border border-white/5 rounded-3xl p-8 text-center shadow-2xl"
        >
          <div v-if="initError">
            <Zap class="w-8 h-8 mx-auto mb-3 text-red-500 animate-pulse" />
            <p class="font-black tracking-tighter text-lg mb-1">
              {{ (localeData.dashboard as any)?.initializationFailed }}
            </p>
            <p class="text-xs font-bold opacity-70 leading-relaxed">
              {{
                initError === "__INITIALIZATION_FAILED__"
                  ? (localeData.dashboard as any)?.errors?.bridgeNotAvailable
                  : initError
              }}
            </p>
          </div>
          <div v-else>
            <Globe class="w-8 h-8 mx-auto mb-3 text-blue-500 animate-spin-slow" />
            <p class="font-black tracking-tighter text-lg animate-pulse">
              {{ (localeData.dashboard as any)?.initializingEngines }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <main
      v-else
      class="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans selection:bg-blue-500/30"
    >
      <!-- Header -->
      <header
        class="px-8 py-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-6 backdrop-blur-md sticky top-0 z-50 bg-[#0a0a0a]/80"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20"
          >
            <LayoutGrid class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-black tracking-tighter text-white">
              {{ (localeData.dashboard as any)?.title }}
            </h1>
            <p
              class="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase"
            >
              {{ (localeData.dashboard as any)?.subtitle }}
            </p>
          </div>
        </div>

        <div
          class="flex items-center gap-3 bg-[#111] p-1.5 rounded-2xl border border-white/5"
        >
          <button
            class="px-4 py-2 rounded-xl text-xs font-black transition-all hover:bg-white/5 flex items-center gap-2"
            :aria-label="(localeData.dashboard as any)?.languageSelector"
            @click="toggleLocale"
          >
            <Globe class="w-3.5 h-3.5 text-blue-400" />
            {{
              locale === "ja"
                ? (localeData.dashboard as any)?.language?.en
                : (localeData.dashboard as any)?.language?.ja
            }}
          </button>

          <div class="w-px h-4 bg-white/10 mx-1" />

          <button
            class="px-4 py-2 rounded-xl text-xs font-black transition-all bg-blue-600 text-white shadow-lg shadow-blue-600/20 flex items-center gap-2"
            :aria-label="(localeData.dashboard as any)?.engineSelector"
            @click="toggleEngine"
          >
            <Sword class="w-3.5 h-3.5" />
            {{
              activeEngine === "chess"
                ? (localeData.dashboard as any)?.shogiLabel
                : (localeData.dashboard as any)?.chessLabel
            }}
          </button>
        </div>
      </header>

      <div class="p-8">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            :label="(localeData.dashboard as any)?.stats?.engineRuntime?.label"
            :value="(localeData.dashboard as any)?.stats?.engineRuntime?.value"
            :sub="(localeData.dashboard as any)?.stats?.engineRuntime?.sub"
          >
            <template #icon>
              <component :is="icons.zap" class="w-5 h-5 text-yellow-400" />
            </template>
          </StatCard>
          <StatCard
            :label="(localeData.dashboard as any)?.stats?.hardware?.label"
            :value="(localeData.dashboard as any)?.stats?.hardware?.value"
            :sub="(localeData.dashboard as any)?.stats?.hardware?.sub"
          >
            <template #icon>
              <component :is="icons.cpu" class="w-5 h-5 text-purple-400" />
            </template>
          </StatCard>
          <StatCard
            :label="(localeData.dashboard as any)?.stats?.performance?.label"
            :value="(localeData.dashboard as any)?.stats?.performance?.value"
            :sub="(localeData.dashboard as any)?.stats?.performance?.sub"
          >
            <template #icon>
              <component :is="icons.gauge" class="w-5 h-5 text-blue-400" />
            </template>
          </StatCard>
          <StatCard
            :label="(localeData.dashboard as any)?.stats?.accessibility?.label"
            :value="(localeData.dashboard as any)?.stats?.accessibility?.value"
            :sub="(localeData.dashboard as any)?.stats?.accessibility?.sub"
          >
            <template #icon>
              <component :is="icons.trophy" class="w-5 h-5 text-pink-400" />
            </template>
          </StatCard>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <!-- Monitor Panel -->
          <div class="xl:col-span-4">
            <EngineMonitorPanel
              :engine="activeEngine === 'chess' ? chessEngine : shogiEngine"
              :search-options="activeEngine === 'chess' ? chessOptions : shogiOptions"
              :title="
                activeEngine === 'chess'
                  ? (localeData.engine as any)?.stockfishTitle
                  : (localeData.engine as any)?.yaneuraouTitle
              "
            />
          </div>

          <!-- Board Area -->
          <div class="xl:col-span-8 space-y-8">
            <div
              class="bg-[#111] rounded-[2rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group"
            >
              <div
                class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
              />

              <div class="flex items-center justify-between mb-10">
                <div>
                  <h2 class="text-3xl font-black tracking-tighter text-white mb-1">
                    {{ (localeData.dashboard as any)?.gameBoard?.title }}
                  </h2>
                  <p
                    class="text-xs font-bold text-white/30 uppercase tracking-widest"
                  >
                    {{ (localeData.dashboard as any)?.gameBoard?.subtitle }}
                  </p>
                </div>
                <div
                  class="px-6 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4"
                >
                  <div class="flex flex-col items-end">
                    <span
                      class="text-[10px] font-black text-white/20 uppercase tracking-tighter"
                    >
                      {{ (localeData.engine as any)?.topCandidate }}
                    </span>
                    <span class="text-xl font-mono font-black text-blue-400">
                      {{
                        activeEngine === "chess"
                          ? chessBestMove || "---"
                          : shogiBestMove || "---"
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex justify-center">
                <div class="w-full max-w-[600px] aspect-square relative">
                  <ChessBoard
                    v-if="activeEngine === 'chess'"
                    class="w-full h-full rounded-xl shadow-2xl"
                    :fen="(chessState.position as any)"
                    :last-move="(chessBestMove as any)"
                    :locale="locale"
                    :board-label="(localeData.dashboard as any)?.gameBoard?.title"
                    :error-message="(localeData.dashboard as any)?.gameBoard?.invalidPosition"
                    :piece-names="(localeData.dashboard as any)?.gameBoard?.chessPieces"
                  />
                  <ShogiBoard
                    v-else
                    class="w-full h-full rounded-xl shadow-2xl"
                    :sfen="(shogiState.position as any)"
                    :last-move="(shogiBestMove as any)"
                    :locale="locale"
                    :board-label="(localeData.dashboard as any)?.gameBoard?.title"
                    :error-message="(localeData.dashboard as any)?.gameBoard?.invalidPosition"
                    :piece-names="(localeData.dashboard as any)?.gameBoard?.shogiPieces"
                    :hand-sente-label="(localeData.dashboard as any)?.gameBoard?.handSente"
                    :hand-gote-label="(localeData.dashboard as any)?.gameBoard?.handGote"
                  />
                </div>
              </div>
            </div>

            <!-- Bottom Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="bg-[#111] rounded-[2rem] p-8 border border-white/5">
                <div class="flex items-center gap-3 mb-4">
                  <div
                    class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                  <h3
                    class="text-sm font-black text-white uppercase tracking-tighter"
                  >
                    {{ (localeData.dashboard as any)?.technicalInsight?.title }}
                  </h3>
                </div>
                <p class="text-xs font-bold text-white/50 leading-relaxed">
                  {{ (localeData.dashboard as any)?.technicalInsight?.description }}
                </p>
              </div>

              <div
                class="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-600/10 relative overflow-hidden group"
              >
                <Zap
                  class="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 transition-transform group-hover:scale-110 duration-700"
                />
                <h3
                  class="text-sm font-black uppercase tracking-tighter mb-6 relative z-10"
                >
                  {{ (localeData.dashboard as any)?.zenithFeatures?.title }}
                </h3>
                <ul class="space-y-4 relative z-10">
                  <li
                    v-for="(feature, i) in [
                      {
                        icon: icons.zap,
                        label: (localeData.dashboard as any)?.zenithFeatures?.multiPv,
                      },
                      {
                        icon: icons.gauge,
                        label: (localeData.dashboard as any)?.zenithFeatures?.reactiveState,
                      },
                      {
                        icon: icons.cpu,
                        label: (localeData.dashboard.zenithFeatures as any)?.contractUi,
                      },
                    ]"
                    :key="i"
                    class="flex items-center gap-3 text-xs font-black"
                  >
                    <div
                      class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
                    >
                      <component :is="feature.icon" class="w-4 h-4" />
                    </div>
                    {{ feature.label }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </EngineUIProvider>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 3s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
