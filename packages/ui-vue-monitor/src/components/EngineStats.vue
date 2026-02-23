<script setup lang="ts">
import { SearchStatistics, formatNumber, formatTime } from "@multi-game-engines/ui-core";
import { Gauge, Cpu, Layers, Timer } from "lucide-vue-next";
import { useEngineUI } from "@multi-game-engines/ui-vue-core";

interface Props {
  stats: SearchStatistics;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  className: "",
});

const { strings } = useEngineUI();
</script>

<template>
  <div
    :class="[
      'grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg',
      className,
    ]"
  >
    <!-- Depth / Visits -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Layers class="w-4 h-4" />
        <span v-if="stats.visits && stats.visits > 0">{{ strings.visits }}</span>
        <span v-else>{{ strings.depth }}</span>
      </div>
      <div class="text-sm font-bold text-gray-900 font-mono">
        <template v-if="stats.visits && stats.visits > 0">
          {{ formatNumber(stats.visits) }}{{ strings.visitsUnit }}
        </template>
        <template v-else>
          {{ stats.depth }}{{ stats.seldepth ? `/${stats.seldepth}` : "" }}
        </template>
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
        {{ formatTime(stats.time) }}{{ strings.timeUnitSeconds }}
      </div>
    </div>
  </div>
</template>
