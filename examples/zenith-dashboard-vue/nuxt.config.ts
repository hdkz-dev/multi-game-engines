import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },

  // 全処理をクライアントサイドで実行（SSR無し）
  ssr: false,

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  // Monorepo パッケージをトランスパイル対象に含める
  build: {
    transpile: [
      "@multi-game-engines/core",
      "@multi-game-engines/ui-core",
      "@multi-game-engines/ui-vue",
      "@multi-game-engines/i18n",
    ],
  },

  // WASM + SharedArrayBuffer のための COOP/COEP ヘッダー
  routeRules: {
    "/**": {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
  },

  typescript: {
    strict: true,
  },
});
