/**
 * Playwright Component Testing setup file for ui-react-monitor.
 *
 * This file is loaded before each component test. It sets up any global
 * providers or mocks needed by the components under test.
 *
 * NOTE: No GPL engine binaries are loaded here (ADR-014 license isolation).
 * Components are tested with mock data passed directly as props.
 */
import { beforeMount } from "@playwright/experimental-ct-react/hooks";
import { EngineUIProvider } from "@multi-game-engines/ui-react-core";
import React from "react";

// Wrap every mounted component in EngineUIProvider so that hooks like
// useEngineUI() work without needing a real engine connection.
beforeMount(async ({ App }) => {
  return (
    <EngineUIProvider>
      <App />
    </EngineUIProvider>
  );
});
