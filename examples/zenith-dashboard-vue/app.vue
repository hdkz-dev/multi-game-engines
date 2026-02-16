<script setup lang="ts">
import { EngineUIProvider } from "@multi-game-engines/ui-vue";
import { locales } from "@multi-game-engines/i18n";

const enLocale = locales.en;
</script>

<template>
  <EngineUIProvider :locale-data="enLocale">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </EngineUIProvider>
</template>
