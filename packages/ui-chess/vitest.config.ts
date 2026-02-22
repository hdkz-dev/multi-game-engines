import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [
      resolve(import.meta.dirname, "../../fixtures/shared-mocks/lit-setup.ts"),
    ],
  },
});
