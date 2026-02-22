import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import react from "@vitejs/plugin-react";
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
    react(),
    dts({
      insertTypesEntry: true,
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
      entry: {
        elements: resolve(__dirname, "src/elements.ts"),
        react: resolve(__dirname, "src/react.tsx"),
        vue: resolve(__dirname, "src/vue.ts"),
      },
      name: "UIShogi",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "vue",
        "react",
        "lit",
        "@multi-game-engines/core",
        "@multi-game-engines/ui-core",
        "@multi-game-engines/i18n",
      ],
    },
  },
});
