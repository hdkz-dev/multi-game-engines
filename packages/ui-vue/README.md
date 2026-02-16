# @multi-game-engines/ui-vue

Vue 3 adapter for multi-game-engines, built on the Zenith Tier architecture.

## Features

- **Composition API**: `useEngineMonitor` composable for reactive engine state.
- **Components**: `EngineMonitorPanel`, `ScoreBadge`, `EngineStats`, `PVList`.
- **Storybook 10**: Fully supported with Tailwind CSS v4 integration.
- **Dependency Injection**: `provideEngineUI` / `useEngineUI` for i18n and theming.

## Usage

```vue
<script setup>
import { useEngineMonitor } from "@multi-game-engines/ui-vue";
import { EngineMonitorPanel } from "@multi-game-engines/ui-vue";

const { state, search } = useEngineMonitor(engine);
</script>

<template>
  <EngineMonitorPanel :engine="engine" :searchOptions="{ fen: 'startpos' }" />
</template>
```
