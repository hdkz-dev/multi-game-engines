<script setup lang="ts">
import { ref, computed } from "vue";
import { createFEN, createSFEN } from "@multi-game-engines/core";
import { EngineMonitorPanel, BoardComponents } from "@multi-game-engines/ui-vue";
import { useEngineMonitor } from "@multi-game-engines/ui-vue/hooks";
import { locales } from "@multi-game-engines/i18n";
import { LayoutGrid, Sword, Trophy, Zap } from "lucide-vue-next";
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
};
const { state: chessState } = useEngineMonitor(chessEngine.value);

// 将棋用の設定
const shogiEngine = computed(() => bridge?.getEngine("yaneuraou") ?? null);
const shogiOptions = {
  sfen: createSFEN(
    "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
  ),
};
const { state: shogiState } = useEngineMonitor(shogiEngine.value);

const chessBestMove = computed(() => chessState.value.pvs[0]?.moves[0]);
const shogiBestMove = computed(() => shogiState.value.pvs[0]?.moves[0]);

const protocolLabel = computed(() =>
  activeEngine.value === "chess" ? "UCI 16.1" : "USI 7.5.0",
);
</script>

<template>
  <main class="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
    <!-- Header Area -->
    <header
      class="flex flex-col md:flex-row md:items-end justify-between gap-4"
    >
      <div>
        <h1
          class="text-3xl font-black tracking-tighter text-gray-900 dark:text-white flex items-center gap-2"
        >
          <LayoutGrid class="w-8 h-8 text-blue-500" />
          ZENITH <span class="text-blue-500">DASHBOARD</span>
          <span
            class="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2"
          >
            Vue
          </span>
        </h1>
        <p class="text-sm text-gray-500 font-medium">
          2026 Zenith Tier Multi-Game Engine Analysis — Vue 3 + Nuxt 3
        </p>
      </div>

      <div class="flex items-center gap-4">
        <!-- Language Switcher -->
        <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full items-center">
          <button
            @click="locale = 'en'"
            :class="[
              'px-3 py-1 rounded-full text-[10px] font-black transition-all',
              locale === 'en' ? 'bg-gray-900 text-white' : 'text-gray-400'
            ]"
          >
            EN
          </button>
          <button
            @click="locale = 'ja'"
            :class="[
              'px-3 py-1 rounded-full text-[10px] font-black transition-all',
              locale === 'ja' ? 'bg-gray-900 text-white' : 'text-gray-400'
            ]"
          >
            JA
          </button>
        </div>

        <nav
          class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg"
          aria-label="Engine selector"
        >
          <button
            :aria-pressed="activeEngine === 'chess'"
            :class="[
              'flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all',
              activeEngine === 'chess'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            ]"
            @click="activeEngine = 'chess'"
          >
            <Trophy class="w-4 h-4" />
            CHESS
          </button>
          <button
            :aria-pressed="activeEngine === 'shogi'"
            :class="[
              'flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all',
              activeEngine === 'shogi'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            ]"
            @click="activeEngine = 'shogi'"
          >
            <Sword class="w-4 h-4" />
            SHOGI
          </button>
        </nav>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div class="flex items-center gap-2 text-gray-400 mb-1">
          <Zap class="w-4 h-4" />
          <span class="text-[10px] font-black uppercase tracking-widest">
            Environment
          </span>
        </div>
        <div class="text-lg font-bold text-gray-900 dark:text-white">
          WASM SIMD + Threads
        </div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div class="flex items-center gap-2 text-gray-400 mb-1">
          <LayoutGrid class="w-4 h-4" />
          <span class="text-[10px] font-black uppercase tracking-widest">
            Protocol
          </span>
        </div>
        <div
          class="text-lg font-bold text-gray-900 dark:text-white uppercase"
        >
          {{ protocolLabel }}
        </div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div class="flex items-center gap-2 text-gray-400 mb-1">
          <Trophy class="w-4 h-4" />
          <span class="text-[10px] font-black uppercase tracking-widest">
            UI Framework
          </span>
        </div>
        <div class="text-lg font-bold text-emerald-500">
          Vue 3 + Nuxt 3
        </div>
      </div>
    </div>

    <!-- Main Analysis Area -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-4 xl:col-span-3">
        <EngineMonitorPanel
          v-if="activeEngine === 'chess' && chessEngine"
          :engine="chessEngine"
          :search-options="chessOptions"
          title="Stockfish 16.1"
        />
        <EngineMonitorPanel
          v-if="activeEngine === 'shogi' && shogiEngine"
          :engine="shogiEngine"
          :search-options="shogiOptions"
          title="Yaneuraou 7.5.0"
        />
      </div>

      <div class="lg:col-span-8 xl:col-span-9 space-y-4">
        <div
          class="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl aspect-video flex items-center justify-center relative overflow-hidden"
        >
          <div class="w-full max-w-md aspect-square bg-white dark:bg-gray-900 rounded-xl shadow-inner flex items-center justify-center relative p-4">
            <BoardComponents
              v-if="activeEngine === 'chess'"
              type="chess"
              :fen="chessOptions.fen"
              :last-move="chessBestMove"
              :board-label="localeData.dashboard.gameBoard.title"
              :error-message="localeData.dashboard.gameBoard.invalidPosition"
              :piece-names="localeData.dashboard.gameBoard.chessPieces"
              class="w-full h-full"
            />
            <BoardComponents
              v-else
              type="shogi"
              :sfen="shogiOptions.sfen"
              :last-move="shogiBestMove"
              :board-label="localeData.dashboard.gameBoard.title"
              :error-message="localeData.dashboard.gameBoard.invalidPosition"
              :piece-names="localeData.dashboard.gameBoard.shogiPieces"
              class="w-full h-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700"
          >
            <h3
              class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4"
            >
              Deep Analysis Context
            </h3>
            <p
              class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              This dashboard demonstrates the seamless integration of
              disparate game engines using <strong>Vue 3</strong> and
              <strong>Nuxt 3</strong>. The
              <strong>Multi-Game Engines Core</strong> unifies protocols,
              while the <strong>UI Vue</strong> package provides reactive
              composables and components.
            </p>
          </div>
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700"
          >
            <h3
              class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4"
            >
              Vue Zenith Features
            </h3>
            <ul class="text-sm space-y-2 font-medium">
              <li class="flex items-center gap-2 text-green-500">
                <span class="w-1.5 h-1.5 bg-current rounded-full" />
                Vue 3 Composition API
              </li>
              <li class="flex items-center gap-2 text-green-500">
                <span class="w-1.5 h-1.5 bg-current rounded-full" />
                Nuxt 3 SPA Mode
              </li>
              <li class="flex items-center gap-2 text-green-500">
                <span class="w-1.5 h-1.5 bg-current rounded-full" />
                Reactive Core State (ref/computed)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
