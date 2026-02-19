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
        hooks: resolve(__dirname, "src/hooks.ts"),
      },
      name: "UIVueCore",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "vue",
        "lit",
        "@multi-game-engines/core",
        "@multi-game-engines/domain-chess",
        "@multi-game-engines/domain-shogi",
        "@multi-game-engines/ui-chess-elements",
        "@multi-game-engines/ui-shogi-elements",
        "@multi-game-engines/ui-core",
        "@multi-game-engines/i18n",
        "lucide-vue-next",
      ],
      output: {
        globals: {
          vue: "Vue",
          lit: "Lit",
          "@multi-game-engines/core": "MGE_Core",
          "@multi-game-engines/ui-core": "MGE_UICore",
          "@multi-game-engines/i18n": "MGE_I18n",
          "lucide-vue-next": "LucideVue",
        },
      },
    },
  },
});
