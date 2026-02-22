import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    testTimeout: 10000,
    environment: "jsdom",
    setupFiles: [
      resolve(import.meta.dirname, "../../fixtures/shared-mocks/lit-setup.ts"),
    ],
  },
});
