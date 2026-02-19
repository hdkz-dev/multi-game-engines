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
      entry: resolve(__dirname, "src/index.ts"),
      name: "UIChessVue",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "vue",
        "lit",
        "@multi-game-engines/core",
        "@multi-game-engines/domain-chess",
        "@multi-game-engines/ui-chess-elements",
      ],
    },
  },
});
