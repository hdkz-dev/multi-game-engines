<script setup lang="ts">
import { computed } from "vue";
import type { IEngine, IBaseSearchOptions, IBaseSearchResult } from "@multi-game-engines/core";
import { EvaluationPresenter, createInitialState } from "@multi-game-engines/ui-core";
import { useEngineMonitor } from "../useEngineMonitor.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEngine = IEngine<IBaseSearchOptions, any, IBaseSearchResult>;

const props = defineProps<{
  engine: AnyEngine;
  label: string;
}>();

const { state, status } = useEngineMonitor(() => props.engine);

const score = computed(() => state.value.pvs[0]?.score ?? null);

const colorClass = computed(() =>
  score.value
    ? EvaluationPresenter.getColorClass(score.value, false)
    : "text-gray-400",
);

const displayText = computed(() =>
  score.value ? EvaluationPresenter.getDisplayLabel(score.value, false) : "—",
);

const statusDot = computed(() => {
  switch (status.value) {
    case "busy":
      return "bg-blue-500 animate-pulse";
    case "ready":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
});

const depth = computed(() => state.value.stats.depth);
</script>

<template>
  <div
    class="flex flex-col items-center gap-1 min-w-[80px] px-2"
    :aria-label="`${label}: ${displayText}`"
  >
    <div class="flex items-center gap-1.5">
      <span
        :class="['w-2 h-2 rounded-full flex-shrink-0', statusDot]"
        aria-hidden="true"
      />
      <span class="text-xs font-medium text-gray-600 truncate max-w-[120px]">
        {{ label }}
      </span>
    </div>
    <span
      :class="['text-lg font-bold tabular-nums leading-tight', colorClass]"
      aria-live="polite"
    >
      {{ displayText }}
    </span>
    <span v-if="depth > 0" class="text-xs text-gray-400">d{{ depth }}</span>
  </div>
</template>
