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
      include: ["src/**/*"],
    }),
  ],
  build: {
    minify: "esbuild",
    esbuild: {
      minifyIdentifiers: false,
    },
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
      },
      name: "UIVueMonitor",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "vue",
        "lit",
        "@multi-game-engines/core",
        "@multi-game-engines/ui-core",
        "@multi-game-engines/ui-vue-core",
        "lucide-vue-next",
      ],
      output: {
        globals: {
          vue: "Vue",
          lit: "Lit",
          "@multi-game-engines/core": "MGE_Core",
          "@multi-game-engines/ui-core": "MGE_UICore",
          "@multi-game-engines/ui-vue-core": "MGE_UIVueCore",
          "lucide-vue-next": "LucideVue",
        },
      },
    },
  },
});
