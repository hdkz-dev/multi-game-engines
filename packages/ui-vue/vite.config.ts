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
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        hooks: resolve(__dirname, "src/hooks.ts"),
        chess: resolve(__dirname, "src/chess/index.ts"),
        shogi: resolve(__dirname, "src/shogi/index.ts"),
      },
      name: "UIVue",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "vue",
        "@multi-game-engines/core",
        "@multi-game-engines/ui-core",
        "lucide-vue-next",
      ],
      output: {
        globals: {
          vue: "Vue",
          "@multi-game-engines/core": "MGE_Core",
          "@multi-game-engines/ui-core": "MGE_UICore",
          "lucide-vue-next": "LucideVue",
        },
      },
    },
  },
});
