import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["../../fixtures/shared-mocks/lit-setup.ts"],
  },
});
