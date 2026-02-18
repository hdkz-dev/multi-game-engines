<script setup lang="ts">
import { ref, computed } from "vue";
import { createFEN, createSFEN } from "@multi-game-engines/core";
import { formatNumber } from "@multi-game-engines/ui-core";
import { EngineMonitorPanel, ChessBoard, ShogiBoard, EngineUIProvider } from "@multi-game-engines/ui-vue";
import { useEngineMonitor } from "@multi-game-engines/ui-vue/hooks";
import { locales } from "@multi-game-engines/i18n";
import { LayoutGrid, Sword, Trophy, Zap, Globe, Cpu, Gauge } from "lucide-vue-next";
import { getBridge } from "~/composables/useEngines";

useHead({
  title: "Zenith Hybrid Analysis Dashboard (Vue)",
  meta: [
    {
      name: "description",
      content:
        "Advanced game engine analysis powered by multi-game-engines (Vue 3 + Nuxt 3)",
    },
  ],
});

type EngineType = "chess" | "shogi";
const activeEngine = ref<EngineType>("chess");
const locale = ref("ja");
const localeData = computed(() => (locale.value === "ja" ? locales.ja : locales.en));

const bridge = getBridge();

// チェス用の設定
const chessEngine = computed(() => bridge?.getEngine("stockfish") ?? null);
const chessOptions = {
  fen: createFEN(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ),
  multipv: 3,
};
const { state: chessState } = useEngineMonitor(chessEngine);

// 将棋用の設定
const shogiEngine = computed(() => bridge?.getEngine("yaneuraou") ?? null);
const shogiOptions = {
  sfen: createSFEN(
    "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
  ),
  multipv: 2,
};
const { state: shogiState } = useEngineMonitor(shogiEngine);

const chessBestMove = computed(() => chessState.value?.pvs[0]?.moves[0]);
const shogiBestMove = computed(() => shogiState.value?.pvs[0]?.moves[0]);

const nps = computed(() => {
  const stats = activeEngine.value === "chess" ? chessState.value.stats : shogiState.value.stats;
  return formatNumber(stats.nps);
});
</script>

<template>
  <div
    v-if="!bridge || !chessEngine || !shogiEngine"
    class="min-h-screen flex items-center justify-center bg-gray-50"
  >
    <div class="flex flex-col items-center gap-4">
      <div
        class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
      ></div>
      <p class="text-gray-500 font-bold tracking-widest text-sm">
        {{ localeData.dashboard.initializingEngines }}
      </p>
    </div>
  </div>

  <EngineUIProvider v-else :locale-data="localeData">
    <main class="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/30">
      <!-- Header Area -->
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-4xl font-black tracking-tighter text-gray-900 flex items-center gap-3">
            <div class="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <LayoutGrid class="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            {{ localeData.dashboard.title }}
          </h1>
          <p class="text-sm text-gray-400 font-bold uppercase tracking-[0.2em] ml-1">
            {{ localeData.dashboard.subtitle }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <!-- Language Switcher -->
          <div class="flex bg-white shadow-sm border border-gray-200 p-1 rounded-full items-center">
            <Globe class="w-4 h-4 ml-2 text-gray-400" aria-hidden="true" />
            <button
              :class="[
                'px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all',
                locale === 'en' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'
              ]"
              @click="locale = 'en'"
            >
              EN
            </button>
            <button
              :class="[
                'px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all',
                locale === 'ja' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'
              ]"
              @click="locale = 'ja'"
            >
              JA
            </button>
          </div>

          <!-- Engine Switcher -->
          <nav
            class="flex bg-white shadow-sm border border-gray-200 p-1 rounded-xl"
            :aria-label="localeData.dashboard.engineSelector"
          >
            <button
              :aria-pressed="activeEngine === 'chess'"
              :class="[
                'flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black transition-all',
                activeEngine === 'chess'
                  ? 'bg-blue-600 shadow-md shadow-blue-200 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              ]"
              @click="activeEngine = 'chess'"
            >
              <Trophy
                :class="['w-4 h-4', { 'animate-bounce': activeEngine === 'chess' }]"
                aria-hidden="true"
              />
              {{ localeData.dashboard.chessLabel }}
            </button>
            <button
              :aria-pressed="activeEngine === 'shogi'"
              :class="[
                'flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black transition-all',
                activeEngine === 'shogi'
                  ? 'bg-blue-600 shadow-md shadow-blue-200 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              ]"
              @click="activeEngine = 'shogi'"
            >
              <Sword
                :class="['w-4 h-4', { 'animate-bounce': activeEngine === 'shogi' }]"
                aria-hidden="true"
              />
              {{ localeData.dashboard.shogiLabel }}
            </button>
          </nav>
        </div>
      </header>

      <!-- Hero Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon-class="text-yellow-500"
          :label="localeData.dashboard.stats.engineRuntime.label"
          :value="nps"
          :sub="localeData.engine.npsUnit"
        >
          <template #icon><Zap class="w-5 h-5" /></template>
        </StatCard>
        <StatCard
          icon-class="text-blue-500"
          :label="localeData.dashboard.stats.hardware.label"
          :value="localeData.dashboard.stats.hardware.value"
          :sub="localeData.dashboard.stats.hardware.sub"
        >
          <template #icon><Cpu class="w-5 h-5" /></template>
        </StatCard>
        <StatCard
          icon-class="text-green-500"
          :label="localeData.dashboard.stats.performance.label"
          :value="localeData.dashboard.stats.performance.value"
          :sub="localeData.dashboard.stats.performance.sub"
        >
          <template #icon><Gauge class="w-5 h-5" /></template>
        </StatCard>
        <StatCard
          icon-class="text-purple-500"
          :label="localeData.dashboard.stats.accessibility.label"
          :value="localeData.dashboard.stats.accessibility.value"
          :sub="localeData.dashboard.stats.accessibility.sub"
        >
          <template #icon><Trophy class="w-5 h-5" /></template>
        </StatCard>
      </div>

      <!-- Main Analysis Area -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-4 xl:col-span-3 h-full min-h-[600px]">
          <EngineMonitorPanel
            v-if="activeEngine === 'chess' && chessEngine"
            key="chess-panel"
            :engine="chessEngine"
            :search-options="chessOptions"
            :title="localeData.engine.stockfishTitle || 'Stockfish 16.1'"
            class="h-full"
          />
          <EngineMonitorPanel
            v-if="activeEngine === 'shogi' && shogiEngine"
            key="shogi-panel"
            :engine="shogiEngine"
            :search-options="shogiOptions"
            :title="localeData.engine.yaneuraouTitle || 'Yaneuraou 7.5.0'"
            class="h-full"
          />
        </div>

        <div class="lg:col-span-8 xl:col-span-9 space-y-6">
          <!-- Game Board Area -->
          <div class="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl shadow-gray-200/50 aspect-video flex flex-col items-center justify-center relative overflow-hidden group">
            <div class="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

            <div class="w-full max-w-md aspect-square bg-white rounded-xl shadow-inner flex items-center justify-center relative p-4">
              <ChessBoard
                v-if="activeEngine === 'chess'"
                :fen="chessOptions.fen"
                :last-move="chessBestMove"
                :board-label="localeData.dashboard.gameBoard.title"
                :error-message="localeData.dashboard.gameBoard.invalidPosition"
                :piece-names="localeData.dashboard.gameBoard.chessPieces"
                :locale="locale"
                class="w-full h-full"
              />
              <ShogiBoard
                v-else
                :sfen="shogiOptions.sfen"
                :last-move="shogiBestMove"
                :board-label="localeData.dashboard.gameBoard.title"
                :error-message="localeData.dashboard.gameBoard.invalidPosition"
                :hand-sente-label="localeData.dashboard.gameBoard.handSente"
                :hand-gote-label="localeData.dashboard.gameBoard.handGote"
                :piece-names="localeData.dashboard.gameBoard.shogiPieces"
                :locale="locale"
                class="w-full h-full"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 class="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <span class="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                {{ localeData.dashboard.technicalInsight.title }}
              </h3>
              <p class="text-sm text-gray-600 leading-relaxed font-medium">
                {{ localeData.dashboard.technicalInsight.description }}
              </p>
            </div>
            <div class="bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl">
              <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">
                {{ localeData.dashboard.zenithFeatures.title }}
              </h3>
              <ul class="text-sm space-y-3">
                <li class="flex items-center gap-3 text-white/80 font-bold">
                  <div class="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Zap class="w-3 h-3 text-green-500" />
                  </div>
                  {{ localeData.dashboard.zenithFeatures.multiPv }}
                </li>
                <li class="flex items-center gap-3 text-white/80 font-bold">
                  <div class="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Zap class="w-3 h-3 text-green-500" />
                  </div>
                  {{ localeData.dashboard.zenithFeatures.reactiveState }}
                </li>
                <li class="flex items-center gap-3 text-white/80 font-bold">
                  <div class="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Zap class="w-3 h-3 text-green-500" />
                  </div>
                  {{ localeData.dashboard.zenithFeatures.contractUi }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  </EngineUIProvider>
</template>

<style scoped>
/* Grid background effect */
.bg-grid-slate-100 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(241 245 249 / 1)'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
}
</style>
