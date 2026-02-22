<script
  setup
  lang="ts"
  generic="
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends ExtendedSearchInfo,
    T_RESULT extends IBaseSearchResult
  "
>
import { computed, ref, nextTick, useId } from "vue";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import {
  EngineSearchState,
  ExtendedSearchInfo,
} from "@multi-game-engines/ui-core";
import { useEngineMonitor } from "./useEngineMonitor.js";
import { useEngineUI } from "@multi-game-engines/ui-vue-core";
import ScoreBadge from "./ScoreBadge.vue";
import EngineStats from "./EngineStats.vue";
import EvaluationGraph from "./EvaluationGraph.vue";
import PVList from "./PVList.vue";
import SearchLog from "./SearchLog.vue";
import {
  Settings2,
  Play,
  Square,
  AlertCircle,
  ScrollText,
  History,
} from "lucide-vue-next";

// 2026 Best Practice: Vue 3.3+ のジェネリック・マクロを使用
const props = defineProps<{
  engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>;
  searchOptions: T_OPTIONS;
  title?: string | undefined;
}>();

const emit = defineEmits<{
  (e: "moveClick", move: string): void;
}>();

const panelId = useId();
const titleId = `engine-monitor-title-${panelId}`;

const { strings } = useEngineUI();
const activeTab = ref<"pv" | "log">("pv");
const pvTabRef = ref<HTMLButtonElement | null>(null);
const logTabRef = ref<HTMLButtonElement | null>(null);

const emitUIInteraction = (action: string) => {
  props.engine.emitTelemetry({
    type: "lifecycle",
    timestamp: Date.now(),
    metadata: {
      component: "EngineMonitorPanel",
      action,
      engineId: props.engine.id,
    },
  });
};

const handleTabKeyDown = (e: KeyboardEvent) => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    activeTab.value = activeTab.value === "pv" ? "log" : "pv";
    focusTab();
  } else if (e.key === "Home") {
    e.preventDefault();
    activeTab.value = "pv";
    focusTab();
  } else if (e.key === "End") {
    e.preventDefault();
    activeTab.value = "log";
    focusTab();
  }
};

const focusTab = () => {
  nextTick(() => {
    if (activeTab.value === "pv") pvTabRef.value?.focus();
    else logTabRef.value?.focus();
  });
};

const { state, status, search, stop } = useEngineMonitor<
  EngineSearchState,
  T_OPTIONS,
  T_INFO,
  T_RESULT
>(() => props.engine, {
  autoMiddleware: true,
});

const bestPV = computed(() => state.value.pvs[0]);
const displayTitle = computed(() => props.title ?? strings.value.title);

const announcement = computed(() => {
  if (status.value === "error") return strings.value.errorTitle;
  if (bestPV.value?.score.type === "mate")
    return strings.value.mateIn(bestPV.value.score.value);
  return "";
});

const handleStart = async () => {
  emitUIInteraction("start_click");
  void search(props.searchOptions);
};

const handleStop = async () => {
  emitUIInteraction("stop_click");
  void stop();
};

const handleMoveClick = (move: string) => {
  emit("moveClick", move);
};

const errorMessage = computed(() => {
  const err = props.engine.lastError;
  if (!err) return strings.value.errorDefaultRemediation;

  if (err.i18nKey) {
    // 2026 Best Practice: i18n リソースからの動的取得
    const parts = err.i18nKey.split(".");
    const key = parts[parts.length - 1];
    const errors = strings.value.errors as Record<string, string> | undefined;
    if (key && errors?.[key]) {
      let msg = errors[key]!;
      // パラメータ置換 (例: {move} -> "7g7f")
      if (err.i18nParams) {
        Object.entries(err.i18nParams).forEach(([k, v]) => {
          msg = msg.split(`{${k}}`).join(String(v));
        });
      }
      return msg;
    }
  }

  return err.remediation || strings.value.errorDefaultRemediation;
});
</script>

<template>
  <section
    class="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl"
    :aria-labelledby="titleId"
  >
    <div class="sr-only" aria-live="assertive" role="alert">
      {{ announcement }}
    </div>
    <!-- Header -->
    <header
      class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200"
    >
      <div class="flex items-center gap-2">
        <Settings2 class="w-4 h-4 text-gray-500" />
        <h2
          :id="titleId"
          class="font-bold text-gray-700 text-sm tracking-tight"
        >
          {{ displayTitle }}
        </h2>
        <span
          :class="[
            'w-2.5 h-2.5 rounded-full ml-1 ring-2 ring-white shadow-sm transition-colors duration-500',
            status === 'busy' ? 'bg-green-500 animate-pulse' : 'bg-gray-300',
          ]"
          :title="status"
        />
        <span
          class="text-[10px] text-gray-400 uppercase font-bold tracking-tight"
          role="status"
        >
          {{ status === 'busy' ? strings.searching : strings.ready }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="status === 'busy' || status === 'loading'"
          @click="handleStop"
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 active:scale-95 transition-all focus:ring-2 focus:ring-red-200 outline-none"
        >
          <Square class="w-3.5 h-3.5 fill-current" />
          {{ strings.stop }}
        </button>
        <button
          v-else
          @click="handleStart"
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200 focus:ring-2 focus:ring-blue-300 outline-none"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          {{ strings.start }}
        </button>
      </div>
    </header>

    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-h-0 bg-white">
      <!-- Error State -->
      <div
        v-if="status === 'error'"
        class="flex-1 flex flex-col items-center justify-center p-8 text-center text-red-500 animate-in fade-in zoom-in duration-300"
        role="alert"
      >
        <div class="p-4 bg-red-50 rounded-full mb-4">
          <AlertCircle class="w-10 h-10" />
        </div>
        <h3 class="font-bold text-lg mb-1">{{ strings.errorTitle }}</h3>
        <p class="text-sm text-gray-600 max-w-[240px] leading-relaxed">
          {{ errorMessage }}
        </p>
      </div>

      <template v-else>
        <!-- Best Move & Score Summary -->
        <section
          class="p-5 border-b border-gray-100 bg-gradient-to-br from-white to-gray-50/50"
          aria-label="Current Best Analysis"
        >
          <div class="flex items-center justify-between mb-3">
            <span
              class="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest"
              >{{ strings.topCandidate }}</span
            >
            <ScoreBadge
              v-if="bestPV"
              :score="bestPV.score"
              class="scale-110 shadow-sm"
            />
          </div>
          <div class="flex items-baseline gap-3">
            <div
              class="text-3xl font-mono font-black text-gray-900 tracking-tighter"
            >
              {{ bestPV?.moves[0] || strings.noMove }}
            </div>
            <div
              v-if="state.currentMove"
              class="text-sm text-gray-400 font-mono"
            >
              (evaluating {{ state.currentMove }})
            </div>
          </div>
        </section>

        <!-- Evaluation Trend Graph -->
        <div class="px-4 py-2 bg-white">
          <EvaluationGraph
            :entries="state.evaluationHistory.entries"
            :height="40"
            class="opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>

        <!-- Stats Infrastructure -->
        <EngineStats :stats="state.stats" class="border-b border-gray-100" />

        <!-- Principal Variations / Log List -->
        <div class="flex-1 flex flex-col min-h-0">
          <div
            class="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between"
          >
            <div
              class="flex items-center gap-4"
              role="tablist"
              aria-orientation="horizontal"
              @keydown="handleTabKeyDown"
            >
              <button
                ref="pvTabRef"
                @click="activeTab = 'pv'"
                role="tab"
                :aria-selected="activeTab === 'pv'"
                :aria-controls="`${panelId}-pv-panel`"
                :id="`${panelId}-pv-tab`"
                :tabindex="activeTab === 'pv' ? 0 : -1"
                class="flex items-center gap-1.5 transition-colors outline-none"
                :class="activeTab === 'pv' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'"
              >
                <ScrollText class="w-3.5 h-3.5" />
                <span class="text-[10px] font-bold uppercase tracking-wider">{{ strings.principalVariations }}</span>
              </button>
              <button
                ref="logTabRef"
                @click="activeTab = 'log'"
                role="tab"
                :aria-selected="activeTab === 'log'"
                :aria-controls="`${panelId}-log-panel`"
                :id="`${panelId}-log-tab`"
                :tabindex="activeTab === 'log' ? 0 : -1"
                class="flex items-center gap-1.5 transition-colors outline-none"
                :class="activeTab === 'log' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'"
              >
                <History class="w-3.5 h-3.5" />
                <span class="text-[10px] font-bold uppercase tracking-wider">{{ strings.searchLog }}</span>
              </button>
            </div>
            <span class="text-[10px] font-mono text-gray-300">
              {{ activeTab === 'pv' ? strings.pvCount(state.pvs.length) : strings.logCount(state.searchLog.length) }}
            </span>
          </div>
          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <div
              role="tabpanel"
              :id="`${panelId}-pv-panel`"
              :aria-labelledby="`${panelId}-pv-tab`"
              :hidden="activeTab !== 'pv'"
              class="h-full"
            >
              <PVList
                v-if="activeTab === 'pv'"
                :pvs="state.pvs"
                class="p-4"
                @move-click="handleMoveClick"
              />
            </div>
            <div
              role="tabpanel"
              :id="`${panelId}-log-panel`"
              :aria-labelledby="`${panelId}-log-tab`"
              :hidden="activeTab !== 'log'"
              class="h-full"
            >
              <SearchLog
                v-if="activeTab === 'log'"
                :log="state.searchLog"
                class="border-none rounded-none"
                @move-click="handleMoveClick"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Footer -->
    <footer
      class="px-4 py-2 bg-gray-50/80 border-t border-gray-200 text-[9px] text-gray-400 flex justify-between font-medium"
    >
      <span class="truncate mr-4">
        {{ strings.engineVersion(engine.name, engine.version) }}
      </span>
      <span class="flex-shrink-0">
        {{ strings.engineBridgeStandard(2026) }}
      </span>
    </footer>
  </section>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
