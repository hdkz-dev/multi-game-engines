<script
  setup
  lang="ts"
  generic="
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends ExtendedSearchInfo,
    T_RESULT extends IBaseSearchResult
  "
>
import { computed } from "vue";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { ExtendedSearchInfo } from "@multi-game-engines/ui-core";
import EngineMonitorPanel from "./EngineMonitorPanel.vue";
import EngineSummaryItem from "./EngineSummaryItem.vue";

const props = defineProps<{
  engines: Array<{
    engine: IEngine<T_OPTIONS, T_INFO, T_RESULT>;
    label?: string;
    searchOptions: T_OPTIONS;
  }>;
  /** 個別パネルに付与するクラス */
  panelClass?: string;
}>();

const emit = defineEmits<{
  (e: "moveClick", move: string, engineId: string): void;
}>();

const gridCols = computed(() => {
  const n = props.engines.length;
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-1 md:grid-cols-2";
  return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
});
</script>

<template>
  <section
    v-if="engines.length > 0"
    class="flex flex-col gap-4"
    aria-label="Multi-Engine Analysis"
  >
    <!-- Score comparison bar -->
    <div
      class="flex items-stretch gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl overflow-x-auto"
      role="group"
      aria-label="Score comparison"
    >
      <template v-for="(entry, idx) in engines" :key="entry.engine.id">
        <div
          v-if="idx > 0"
          class="w-px bg-gray-200 flex-shrink-0 self-stretch"
          aria-hidden="true"
        />
        <!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
        <EngineSummaryItem
          :engine="(entry.engine as any)"
          :label="entry.label ?? entry.engine.name"
        />
      </template>
    </div>

    <!-- Individual engine panels -->
    <div :class="['grid gap-4', gridCols]" role="list" aria-label="Engine panels">
      <div v-for="entry in engines" :key="entry.engine.id" role="listitem">
        <EngineMonitorPanel
          :engine="entry.engine"
          :searchOptions="entry.searchOptions"
          :title="entry.label ?? entry.engine.name"
          :class="panelClass"
          @moveClick="(move) => $emit('moveClick', move, entry.engine.id)"
        />
      </div>
    </div>
  </section>
</template>
