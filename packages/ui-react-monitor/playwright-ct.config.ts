import { defineConfig, devices } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";

/**
 * Playwright Component Testing configuration for ui-react-monitor.
 *
 * Tests use mock data only — no GPL engine binaries are loaded.
 * See ADR-014 for the license isolation policy.
 */
export default defineConfig({
  testDir: "./src/__ct__",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    ctPort: 3100,
    ctViteConfig: {
      plugins: [react()],
      resolve: {
        alias: {
          // Use source files in CT so we don't depend on a prior build
        },
      },
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
