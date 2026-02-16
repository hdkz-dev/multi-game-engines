<script setup lang="ts">
import { PrincipalVariation } from '@multi-game-engines/ui-core';
import ScoreBadge from './ScoreBadge.vue';
import { useEngineUI } from './useEngineUI';

interface Props {
  pvs: PrincipalVariation[];
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  className: ''
});

const emit = defineEmits<{
  (e: 'move-click', move: string, index: number, pv: PrincipalVariation): void
}>();

const { strings } = useEngineUI();
</script>

<template>
  <div :class="['space-y-2', className]">
    <div
      v-for="pv in pvs"
      :key="pv.multipv"
      class="flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-gray-400">
            #{{ pv.multipv }}
          </span>
          <ScoreBadge :score="pv.score" />
        </div>
      </div>

      <div class="flex flex-wrap gap-1 font-mono text-sm leading-relaxed">
        <button
          v-for="(move, idx) in pv.moves"
          :key="`${pv.multipv}-${idx}-${move}`"
          type="button"
          @click="emit('move-click', move.toString(), idx, pv)"
          :class="[
            'px-1 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer',
            idx === 0 ? 'font-bold' : 'text-gray-600'
          ]"
        >
          {{ move.toString() }}
        </button>
      </div>
    </div>

    <div v-if="pvs.length === 0" class="py-8 text-center text-gray-400 italic text-sm">
      {{ strings.searching }}
    </div>
  </div>
</template>
