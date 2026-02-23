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
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**"],
    }),
  ],
  esbuild: {
    minifyIdentifiers: false,
  },
  build: {
    minify: "esbuild",
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        hooks: resolve(import.meta.dirname, "src/hooks.ts"),
      },
      name: "UIVue",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "vue",
        "lit",
        "@multi-game-engines/core",
        "@multi-game-engines/ui-core",
        "@multi-game-engines/ui-elements",
        "lucide-vue-next",
      ],
      output: {
        globals: {
          vue: "Vue",
          lit: "Lit",
          "@multi-game-engines/core": "MGE_Core",
          "@multi-game-engines/ui-core": "MGE_UICore",
          "@multi-game-engines/ui-elements": "MGE_UIElements",
          "lucide-vue-next": "LucideVue",
        },
      },
    },
  },
});
