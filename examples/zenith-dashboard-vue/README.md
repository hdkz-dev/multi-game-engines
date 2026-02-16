# Zenith Dashboard (Vue 3 + Nuxt 3)

Vue 3 / Nuxt 3 版のマルチゲームエンジン分析ダッシュボード。
`@multi-game-engines/ui-vue` パッケージを活用した例です。

> React / Next.js 版は [`../zenith-dashboard`](../zenith-dashboard) を参照してください。

## 技術スタック

| レイヤー             | 技術                       |
| -------------------- | -------------------------- |
| UI フレームワーク    | Vue 3.5 (Composition API)  |
| アプリフレームワーク | Nuxt 3 (SPA モード)        |
| スタイリング         | Tailwind CSS v4            |
| アイコン             | lucide-vue-next            |
| エンジンブリッジ     | @multi-game-engines/core   |
| UI コンポーネント    | @multi-game-engines/ui-vue |

## SPA モード

このダッシュボードは `ssr: false` で構成されており、すべての処理がクライアントサイドで実行されます。
WASM エンジンはブラウザ上のみで動作するため、サーバーサイドレンダリングは不要です。

> **デプロイ時の注意**: COOP/COEP ヘッダーは `nuxt.config.ts` の `routeRules` で設定していますが、
> 静的ホスティング（GitHub Pages 等）にデプロイする場合は、ホスティング側でヘッダーを設定してください。

## セットアップ

```bash
# リポジトリルートから
pnpm install
pnpm --filter @examples/zenith-dashboard-vue dev
```

## React 版との対応表

| React (Next.js)                              | Vue (Nuxt 3 SPA)                        |
| -------------------------------------------- | --------------------------------------- |
| `dynamic(() => import(...), { ssr: false })` | 通常 import（SPA のため不要）           |
| `useId()`                                    | `useId()` (Vue 3.5+)                    |
| `useCallback()`                              | 不要 (Vue のリアクティビティシステム)   |
| `useMemo()`                                  | `computed()`                            |
| `useState()`                                 | `ref()`                                 |
| `EngineUIProvider` (Context)                 | `EngineUIProvider` (provide/inject)     |
| `useHead` (next/head)                        | `useHead()` (Nuxt auto-import)          |
| `"use client"`                               | 不要（`ssr: false` で全てクライアント） |
