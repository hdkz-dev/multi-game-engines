import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    testTimeout: 10000,
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // Exclude Playwright CT tests — they run via playwright-ct.config.ts, not Vitest
    exclude: ["**/node_modules/**", "**/dist/**", "**/__ct__/**"],
  },
});
