import { defineConfig, devices } from "@playwright/experimental-ct-vue";

/**
 * Playwright Component Testing configuration for ui-vue-monitor.
 *
 * Runs real-browser tests in Chromium only. No GPL engine binaries are
 * loaded — tests use static mock data (ADR-014 license isolation).
 *
 * NOTE: @playwright/experimental-ct-vue bundles its own @vitejs/plugin-vue
 * internally, so we do not add it explicitly to ctViteConfig.
 *
 * @see https://playwright.dev/docs/test-components
 */
export default defineConfig({
  testDir: "./src/__ct__",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    ctPort: 3101,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
