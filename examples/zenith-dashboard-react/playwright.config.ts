import { defineConfig, devices } from "@playwright/test";

const proxyPort = process.env.PORTLESS_PORT;
const baseURL = `http://dashboard.localhost${proxyPort && proxyPort !== "80" ? `:${proxyPort}` : ""}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 2026: データベース競合（Lock）を防ぐため並列度を制限
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    env: { PORTLESS_HTTPS: "0" },
    command: "pnpm exec portless dashboard next start",
    url: baseURL,
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGINT", timeout: 5000 },
    timeout: 120000,
  },
});
