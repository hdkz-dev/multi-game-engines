<script setup lang="ts" generic="T_OPTIONS extends IBaseSearchOptions, T_INFO extends ExtendedSearchInfo, T_RESULT extends IBaseSearchResult">
import { computed } from 'vue';
import { 
  IEngine, 
  IBaseSearchOptions, 
  IBaseSearchResult 
} from "@multi-game-engines/core";
import { EngineSearchState, ExtendedSearchInfo, EngineUIStrings } from "@multi-game-engines/ui-core";
import { locales } from "@multi-game-engines/i18n";
import { useEngineMonitor } from "./useEngineMonitor.js";
import { Settings2, Play, Square, AlertCircle } from "lucide-vue-next";

const jaStrings = locales.ja.engine as unknown as EngineUIStrings;

// 2026 Best Practice: Vue 3.3+ のジェネリック・マクロを使用
const props = defineProps<{
  engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>;
  searchOptions: T_OPTIONS;
  title?: string;
  strings?: EngineUIStrings;
}>();

const emit = defineEmits<{
  (e: 'moveClick', move: string): void;
}>();

const strings = computed(() => props.strings ?? jaStrings);
const { state, status, search, stop } = useEngineMonitor<EngineSearchState, T_OPTIONS, T_INFO, T_RESULT>(props.engine, {
  autoMiddleware: true
});

const bestPV = computed(() => state.value.pvs[0]);
const displayTitle = computed(() => props.title ?? strings.value.title);

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

const handleStart = async () => {
  void search(props.searchOptions);
};

const handleStop = async () => {
  void stop();
};
</script>

<template>
  <section class="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <Settings2 class="w-4 h-4 text-gray-500" />
        <h2 class="font-bold text-gray-700 text-sm">{{ displayTitle }}</h2>
        <span 
          :class="[
            'w-2 h-2 rounded-full ml-1',
            status === 'busy' ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          ]" 
        />
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          v-if="status === 'busy'"
          @click="handleStop"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-bold hover:bg-red-100"
        >
          <Square class="w-3 h-3 fill-current" />
          {{ strings.stop }}
        </button>
        <button 
          v-else
          @click="handleStart"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-100"
        >
          <Play class="w-3 h-3 fill-current" />
          {{ strings.start }}
        </button>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 flex flex-col min-h-0">
      <div v-if="status === 'error'" class="flex-1 flex flex-col items-center justify-center p-8 text-center text-red-500">
        <AlertCircle class="w-12 h-12 mb-4" />
        <h3 class="font-bold">{{ strings.errorTitle }}</h3>
        <p class="text-xs">{{ engine.lastError?.remediation || strings.errorDefaultRemediation }}</p>
      </div>
      
      <template v-else>
        <!-- Best Move -->
        <section class="p-4 border-b border-gray-100">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{{ strings.topCandidate }}</span>
          </div>
          <div class="text-xl font-mono font-bold text-gray-900">
            {{ bestPV?.moves[0] || strings.noMove }}
          </div>
        </section>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b border-gray-100">
          <div class="flex flex-col">
            <span class="text-[10px] text-gray-400 font-bold uppercase">{{ strings.depth }}</span>
            <span class="text-sm font-mono font-bold">{{ state.stats.depth }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] text-gray-400 font-bold uppercase">{{ strings.nodes }}</span>
            <span class="text-sm font-mono font-bold">{{ formatNumber(state.stats.nodes) }}</span>
          </div>
        </div>

        <!-- PV List -->
        <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
          <div v-for="pv in state.pvs" :key="pv.multipv" class="p-3 border border-gray-100 rounded-lg">
            <div class="text-xs font-bold text-gray-400 mb-1">#{{ pv.multipv }}</div>
            <div class="flex flex-wrap gap-1 font-mono text-sm">
              <span v-for="(move, idx) in pv.moves" :key="idx" class="px-1 rounded hover:bg-blue-50 cursor-pointer" @click="emit('moveClick', move.toString())">
                {{ move }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
