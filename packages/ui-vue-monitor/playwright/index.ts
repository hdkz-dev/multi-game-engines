/**
 * Playwright Component Testing setup file for ui-vue-monitor.
 *
 * This file is loaded before each component test. It sets up the Vue app
 * with any global providers or mocks needed by the components under test.
 *
 * NOTE: No GPL engine binaries are loaded here (ADR-014 license isolation).
 * Components are tested with mock data passed directly as props.
 *
 * The EngineUIProvider's useEngineUI() hook already has a safe fallback for
 * when no provider is present, so no explicit wrapping is needed in most cases.
 * If locale-sensitive strings are needed, use hooksConfig to pass localeData.
 */
import { beforeMount } from "@playwright/experimental-ct-vue/hooks";

// No-op hook: ui-vue-monitor components use useEngineUI() which falls back
// gracefully to default strings when no provider is present (see useEngineUI.ts).
beforeMount(async (_params) => {
  // Future: if a global Vue plugin (e.g. i18n) is needed, install it here:
  // params.app.use(myPlugin);
});
