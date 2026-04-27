import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 10000,
    environment: "jsdom",
    // Exclude Playwright CT tests — they run via playwright-ct.config.ts, not Vitest
    exclude: ["**/node_modules/**", "**/dist/**", "**/__ct__/**"],
  },
});
