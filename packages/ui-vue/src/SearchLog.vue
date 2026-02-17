<script setup lang="ts">
import { ref, watch, onUpdated, nextTick } from 'vue';
import { SearchLogEntry, formatNumber, formatTime } from '@multi-game-engines/ui-core';
import { useEngineUI } from './useEngineUI.js';
import ScoreBadge from './ScoreBadge.vue';

interface Props {
  log: SearchLogEntry[];
  autoScroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoScroll: true
});

const emit = defineEmits<{
  (e: 'move-click', move: string): void;
}>();

const { strings } = useEngineUI();
const scrollContainer = ref<HTMLDivElement | null>(null);
const isNearBottom = ref(true);

const handleScroll = () => {
  if (!scrollContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value;
  isNearBottom.value = scrollHeight - scrollTop - clientHeight < 50;
};

const scrollToBottom = async () => {
  if (
    props.autoScroll &&
    scrollContainer.value &&
    (isNearBottom.value || props.log.length === 0)
  ) {
    await nextTick();
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
};

watch(() => props.log.length, scrollToBottom);

onUpdated(scrollToBottom);
</script>

<template>
  <div
    ref="scrollContainer"
    class="border border-gray-200 rounded-lg bg-white overflow-y-auto max-h-[400px]"
    @scroll="handleScroll"
  >
    <table class="min-w-full text-xs font-mono border-collapse table-fixed">
      <caption class="sr-only">{{ strings.searchLog }}</caption>
      <thead class="bg-gray-50 sticky top-0 z-10 shadow-sm">
        <tr class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          <th scope="col" class="p-2 w-12 text-center border-b border-gray-200">{{ strings.depth || 'D' }}</th>
          <th scope="col" class="p-2 w-20 text-center border-b border-gray-200">{{ strings.score || 'Score' }}</th>
          <th scope="col" class="p-2 w-16 text-right border-b border-gray-200">{{ strings.time || 'Time' }}</th>
          <th scope="col" class="p-2 w-16 text-right border-b border-gray-200">{{ strings.nodes || 'Nodes' }}</th>
          <th scope="col" class="p-2 w-16 text-right border-b border-gray-200">{{ strings.nps || 'NPS' }}</th>
          <th scope="col" class="p-2 text-left border-b border-gray-200 w-auto">{{ strings.pv || 'PV' }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50 bg-white">
        <tr v-if="log.length === 0">
          <td colspan="6" class="py-8 text-center text-gray-400 italic">
            {{ strings.searching || 'Searching...' }}
          </td>
        </tr>
        <tr
          v-else
          v-for="entry in log"
          :key="entry.id"
          class="hover:bg-blue-50 transition-colors group"
        >
          <td class="p-2 text-center text-gray-400 font-medium">
            <template v-if="entry.visits">
              <span :title="strings.visits">
                {{ formatNumber(entry.visits) }}{{ strings.visitsUnit }}
                <span class="sr-only">{{ strings.visits }}</span>
              </span>
            </template>
            <template v-else>
              <span class="sr-only">{{ strings.depth }}: </span>
              {{ entry.depth }}
              <span
                v-if="entry.seldepth"
                class="text-[9px] text-gray-300 group-hover:text-gray-400"
                >/{{ entry.seldepth }}</span
              >
            </template>
          </td>
          <td class="p-2 flex justify-center">
            <div class="w-full flex justify-center">
              <ScoreBadge :score="entry.score" />
            </div>
          </td>
          <td class="p-2 text-right text-gray-500 tabular-nums">
            {{ formatTime(entry.time) }}{{ strings.timeUnitSeconds }}
          </td>
          <td class="p-2 text-right text-gray-500 tabular-nums">
            {{ formatNumber(entry.nodes) }}
          </td>
          <td class="p-2 text-right text-gray-500 tabular-nums">
            {{ formatNumber(entry.nps) }}
          </td>
          <td class="p-2">
            <div class="flex flex-wrap gap-x-1 gap-y-0.5 leading-tight">
              <button
                v-for="(move, idx) in entry.pv"
                :key="`${entry.id}-${idx}-${move}`"
                @click="emit('move-click', move.toString())"
                class="hover:text-blue-600 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-0.5 transition-colors"
                :class="idx === 0 ? 'font-bold text-gray-900' : 'text-gray-500'"
                :aria-label="strings.moveAriaLabel(move.toString())"
              >
                {{ move.toString() }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
