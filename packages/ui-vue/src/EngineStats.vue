<script setup lang="ts">
import { SearchStatistics } from '@multi-game-engines/ui-core';
import { Gauge, Cpu, Layers, Timer } from 'lucide-vue-next';
import { useEngineUI } from './useEngineUI';

interface Props {
  stats: SearchStatistics;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  className: ''
});

const { strings } = useEngineUI();

/**
 * 数値を読みやすい形式にフォーマット (1000 -> 1.0k, 1000000 -> 1.0M)
 */
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};
</script>

<template>
  <div
    :class="[
      'grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg',
      className
    ]"
  >
    <!-- Depth -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Layers class="w-4 h-4" />
        <span>{{ strings.depth }}</span>
      </div>
      <div class="text-sm font-bold text-gray-900 font-mono">
        {{ stats.depth }}{{ stats.seldepth ? `/${stats.seldepth}` : '' }}
      </div>
    </div>

    <!-- Nodes -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Cpu class="w-4 h-4" />
        <span>{{ strings.nodes }}</span>
      </div>
      <div class="text-sm font-bold text-gray-900 font-mono">
        {{ formatNumber(stats.nodes) }}
      </div>
    </div>

    <!-- NPS -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Gauge class="w-4 h-4" />
        <span>{{ strings.nps }}</span>
      </div>
      <div class="text-sm font-bold text-gray-900 font-mono">
        {{ formatNumber(stats.nps) }}
      </div>
    </div>

    <!-- Time -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Timer class="w-4 h-4" />
        <span>{{ strings.time }}</span>
      </div>
      <div class="text-sm font-bold text-gray-900 font-mono">
        {{ (stats.time / 1000).toFixed(1) }}{{ strings.timeUnitSeconds }}
      </div>
    </div>
  </div>
</template>
