import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.endsWith("-board"),
        },
      },
    }),
    dts({
      insertTypesEntry: true,
      staticImport: true,
      include: ["src/**/*"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.test.tsx",
        "**/*.spec.tsx",
        "**/__tests__/**",
      ],
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "UIShogiVue",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "vue",
        "lit",
        "@multi-game-engines/core",
        "@multi-game-engines/domain-shogi",
        "@multi-game-engines/ui-shogi-elements",
      ],
    },
  },
});
