import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },

  // 全処理をクライアントサイドで実行（SSR無し）
  ssr: false,

  css: ["~/assets/css/main.css"],

  vite: {
    // Cast needed: @tailwindcss/vite returns Plugin[][] but Nuxt expects PluginOption[]
    // Both Plugin types come from different vite version resolutions in the monorepo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: tailwindcss() as any,
  },

  // Monorepo パッケージをトランスパイル対象に含める
  build: {
    transpile: [
      "@multi-game-engines/core",
      "@multi-game-engines/ui-core",
      "@multi-game-engines/ui-vue",
      "@multi-game-engines/i18n-common",
      "@multi-game-engines/i18n-dashboard",
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

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => ["shogi-board", "chess-board"].includes(tag),
    },
  },

  typescript: {
    strict: true,
  },
});
