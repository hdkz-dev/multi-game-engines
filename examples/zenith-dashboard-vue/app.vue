<script setup lang="ts">
import { EngineUIProvider } from "@multi-game-engines/ui-vue";
import { commonLocales } from "@multi-game-engines/i18n-common";

const enLocale = commonLocales.en;
</script>

<template>
  <EngineUIProvider :locale-data="enLocale">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </EngineUIProvider>
</template>
