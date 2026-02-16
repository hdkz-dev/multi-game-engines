# Zenith Dashboard (Vue 3 + Nuxt 3)

Vue 3 / Nuxt 3 版のマルチゲームエンジン分析ダッシュボード。
`@multi-game-engines/ui-vue` パッケージを活用した例です。

> React / Next.js 版は [`../zenith-dashboard`](../zenith-dashboard) を参照してください。

## 技術スタック

| レイヤー           | 技術                       |
| ------------------ | -------------------------- |
| UI フレームワーク  | Vue 3.5 (Composition API)  |
| SSR フレームワーク | Nuxt 3                     |
| スタイリング       | Tailwind CSS v4            |
| アイコン           | lucide-vue-next            |
| エンジンブリッジ   | @multi-game-engines/core   |
| UI コンポーネント  | @multi-game-engines/ui-vue |

## セットアップ

```bash
# リポジトリルートから
pnpm install
pnpm --filter @examples/zenith-dashboard-vue dev
```

## React 版との対応表

| React (Next.js)                              | Vue (Nuxt 3)                          |
| -------------------------------------------- | ------------------------------------- |
| `"use client"`                               | `<ClientOnly>`                        |
| `dynamic(() => import(...), { ssr: false })` | `<ClientOnly>` + 通常 import          |
| `useId()`                                    | `useId()` (Vue 3.5+)                  |
| `useCallback()`                              | 不要 (Vue のリアクティビティシステム) |
| `useMemo()`                                  | `computed()`                          |
| `useState()`                                 | `ref()`                               |
| `EngineUIProvider` (Context)                 | `EngineUIProvider` (provide/inject)   |
| `useHead` (next/head)                        | `useHead()` (Nuxt auto-import)        |
