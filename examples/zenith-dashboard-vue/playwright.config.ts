import { defineConfig, devices } from "@playwright/test";

const proxyPort = process.env.PORTLESS_PORT;
const baseURL = `http://vue-dashboard.localhost${proxyPort && proxyPort !== "80" ? `:${proxyPort}` : ""}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    command: "pnpm exec portless vue-dashboard node .output/server/index.mjs",
    url: baseURL,
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGINT", timeout: 5000 },
    timeout: 120000,
  },
});
