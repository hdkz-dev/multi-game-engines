import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.endsWith("-board"),
        },
      },
    }),
  ],
  build: {
    minify: "esbuild",
    esbuild: {
      minifyIdentifiers: false,
    },
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        hooks: resolve(import.meta.dirname, "src/hooks.ts"),
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
        "@multi-game-engines/i18n-common",
        "lucide-vue-next",
      ],
      output: {
        globals: {
          vue: "Vue",
          lit: "Lit",
          "@multi-game-engines/core": "MGE_Core",
          "@multi-game-engines/ui-core": "MGE_UICore",
          "@multi-game-engines/i18n-common": "MGE_I18n",
          "lucide-vue-next": "LucideVue",
        },
      },
    },
  },
});
