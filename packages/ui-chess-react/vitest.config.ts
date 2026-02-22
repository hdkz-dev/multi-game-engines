import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["../../fixtures/shared-mocks/lit-setup.ts"],
  },
});
