<script setup lang="ts">
import { computed } from 'vue';
import { EvaluationPresenter, IEvaluationHistoryEntry } from '@multi-game-engines/ui-core';
import { useEngineUI } from '@multi-game-engines/ui-vue-core';

interface Props {
  entries: IEvaluationHistoryEntry[];
  width?: number | string;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: 60
});

const { strings } = useEngineUI();

const points = computed(() => {
  return EvaluationPresenter.getGraphPoints(props.entries, 200, props.height);
});

const pathData = computed(() => {
  if (points.value.length < 2) return '';
  return `M ${points.value.map((p) => `${p.x},${p.y}`).join(' L ')}`;
});

const lastPoint = computed(() => {
  return points.value.length > 0 ? points.value[points.value.length - 1] : null;
});
</script>

<template>
  <div
    class="relative overflow-hidden rounded bg-gray-50/50 p-1"
    :style="{ width: typeof width === 'number' ? `${width}px` : width, height: `${height}px` }"
    :aria-label="strings.evaluationGraph"
    role="img"
  >
    <svg
      :viewBox="`0 0 200 ${props.height}`"
      class="h-full w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <!-- ゼロライン -->
      <line
        x1="0"
        :y1="props.height / 2"
        x2="200"
        :y2="props.height / 2"
        stroke="currentColor"
        class="text-gray-200"
        stroke-dasharray="2,2"
      />

      <!-- 推移ライン -->
      <path
        :d="pathData"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-primary transition-all duration-300 ease-in-out"
      />

      <!-- 最新のポイント -->
      <circle
        v-if="lastPoint"
        :cx="lastPoint.x"
        :cy="lastPoint.y"
        r="3"
        class="fill-primary"
      />
    </svg>
  </div>
</template>
