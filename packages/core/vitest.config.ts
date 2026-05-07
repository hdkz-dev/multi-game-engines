import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    environment: "node",
  },
  bench: {
    include: ["src/__benchmarks__/**/*.bench.ts"],
    reporters: ["default", "json"],
    outputFile: "bench-results.json",
  },
});
