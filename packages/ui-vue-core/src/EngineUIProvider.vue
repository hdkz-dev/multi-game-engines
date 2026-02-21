<script setup lang="ts">
import { watch } from "vue";
import { createUIStrings } from "@multi-game-engines/ui-core";
import { provideEngineUI } from "./useEngineUI.js";

const props = defineProps<{
  localeData: unknown;
}>();

// provideEngineUI 内部で reactive な strings を作成・提供
const { strings } = provideEngineUI(props.localeData);

// props.localeData の変更を監視して strings を更新
watch(
  () => props.localeData,
  (newData) => {
    strings.value = createUIStrings(newData);
  },
);
</script>

<template>
  <slot />
</template>
