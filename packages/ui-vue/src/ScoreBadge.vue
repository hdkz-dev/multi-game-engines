<script setup lang="ts">
import { computed } from "vue";
import {
  EvaluationScore,
  EvaluationPresenter,
} from "@multi-game-engines/ui-core";
import { useEngineUI } from "./useEngineUI"; // 後ほど作成

interface Props {
  score: EvaluationScore;
  /** 表示を反転させるか（後手視点など） */
  inverted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  inverted: false,
});

const { strings } = useEngineUI();

const colorClass = computed(() =>
  EvaluationPresenter.getColorClass(props.score, props.inverted),
);
const label = computed(() => {
  if (props.score.type === "mate") {
    return strings.value.mateIn(
      Math.abs(props.inverted ? -props.score.value : props.score.value),
    );
  }
  return EvaluationPresenter.getDisplayLabel(props.score, props.inverted);
});

const ariaLabel = computed(() => {
  const displayValue = props.inverted ? -props.score.value : props.score.value;
  if (props.score.type === "mate") {
    return strings.value.mateIn(Math.abs(displayValue));
  }
  return strings.value.advantage(
    EvaluationPresenter.getAdvantageSide(props.score.value, props.inverted),
    Math.abs(displayValue),
  );
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset transition-all',
      colorClass,
    ]"
    :aria-label="ariaLabel"
    role="status"
  >
    {{ label }}
  </span>
</template>
