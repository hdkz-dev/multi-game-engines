<script setup lang="ts">
import { provideEngineUI } from "./useEngineUI";

const props = defineProps<{
  localeData: unknown;
}>();

// provideEngineUI 内部で reactive な strings を作成・提供
provideEngineUI(props.localeData);
</script>

<template>
  <slot />
</template>
