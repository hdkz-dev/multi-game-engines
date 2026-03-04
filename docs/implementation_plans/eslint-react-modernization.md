# [実装計画書] ESLint React 設定の近代化と共有構成パッケージの導入

> 作成日: 2026-03-04 | 関連 ADR: ADR-044 (後継)

## 1. 目的と概要

### 解決する課題

1. **重複設定の排除**: 7つの React パッケージが同一の `eslint-plugin-react-hooks` 設定を個別にコピーしている (CodeRabbit 指摘済み)
2. **ESLint v10 準備**: `eslint-plugin-react` に依存しない構成への移行。`@eslint-react/eslint-plugin` の導入
3. **`zenith-dashboard-react` の脱 `eslint-config-next`**: ESLint v10 非互換の根本原因である `eslint-plugin-react` 依存を排除

### ゴール

- 全 React パッケージが共有 ESLint 設定パッケージ (`@multi-game-engines/eslint-config-react`) を使用
- `@eslint-react/eslint-plugin` による TypeScript ファーストの React リンティング
- `zenith-dashboard-react` が `eslint-config-next` を脱却し、ESLint v10 互換の独自構成に切り替え
- `pnpm lint` が全パッケージで成功

---

## 2. 検討事項・トレードオフ

### A案: 共有設定パッケージの導入 (採用)

- ✅ 重複排除により保守性が大幅向上
- ✅ ルール変更を1箇所で管理可能
- ✅ ESLint v10 移行が一括で完了可能
- ⚠️ 新パッケージ追加のオーバーヘッド

### B案: 各パッケージで個別に @eslint-react を設定 (不採用)

- ❌ 重複がさらに悪化する
- ❌ ルール変更時に 7箇所以上を修正する必要

### zenith-dashboard-react: eslint-config-next を脱却する理由

- `eslint-config-next` v16.1.6 は内部で `eslint-plugin-react` v7.37.x に依存
- `eslint-plugin-react` が ESLint v10 で削除された `context.getFilename()` API を使用 → クラッシュ
- [vercel/next.js#89764](https://github.com/vercel/next.js/issues/89764) として報告済みだが修正時期未定
- `@next/eslint-plugin-next` は独立パッケージとして `recommended` / `core-web-vitals` プリセットを提供 → 直接利用可能

---

## 3. 具体的な変更内容

### Phase 1: 共有 ESLint React 設定パッケージの作成

- [ ] `packages/eslint-config-react/` パッケージの新規作成
  - [ ] `package.json` (name: `@multi-game-engines/eslint-config-react`)
  - [ ] `tsconfig.json`
  - [ ] `src/index.ts` — 共有設定のエクスポート
- [ ] 依存パッケージのインストール
  - `@eslint-react/eslint-plugin` (TypeScript ファーストの React リンティング)
  - `eslint-plugin-react-hooks` (既存、ESLint v10 対応済み)
- [ ] 共有設定の実装
  - `@eslint-react` の `recommended-typescript` プリセット
  - `eslint-plugin-react-hooks` の `flat.recommended` プリセット
  - ファイルフィルター (`**/*.ts`, `**/*.tsx`)

### Phase 2: 既存パッケージの移行

対象パッケージ (7個):

- [ ] `packages/ui-react-core/eslint.config.mjs`
- [ ] `packages/ui-react/eslint.config.mjs`
- [ ] `packages/ui-react-monitor/eslint.config.mjs`
- [ ] `packages/ui-chess-react/eslint.config.mjs`
- [ ] `packages/ui-chess/eslint.config.mjs`
- [ ] `packages/ui-shogi-react/eslint.config.mjs`
- [ ] `packages/ui-shogi/eslint.config.mjs`

各パッケージの変更パターン:

```javascript
// Before
import rootConfig from "../../eslint.config.mjs";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  ...rootConfig,
  {
    ...reactHooks.configs.flat.recommended,
    files: ["**/*.ts", "**/*.tsx"],
  },
];

// After
import rootConfig from "../../eslint.config.mjs";
import reactConfig from "@multi-game-engines/eslint-config-react";

export default [
  ...rootConfig,
  ...reactConfig,
];
```

### Phase 3: zenith-dashboard-react の脱 eslint-config-next

- [ ] `eslint-config-next`, `@eslint/compat` 依存の削除
- [ ] `@next/eslint-plugin-next` を直接使用する構成に変更
- [ ] `eslint-plugin-jsx-a11y` の Next.js 固有ルールの再構成
- [ ] `eslint-plugin-import` の必要なルールの再構成
- [ ] `eslint-config-next` が設定していた Next.js 固有のオーバーライドの適用

### Phase 4: 検証と仕上げ

- [ ] `pnpm lint` で全パッケージの lint 成功を確認
- [ ] `pnpm typecheck` で型チェック成功を確認
- [ ] `pnpm test` で既存テストの通過確認
- [ ] 新規 lint エラー・警告の対処

---

## 4. 影響範囲

### 破壊的変更: なし

- ESLint 設定のみの変更であり、ランタイムコードには影響しない
- ユーザー向け API への変更は一切なし

### パフォーマンス影響

- ✅ **正の影響**: `@eslint-react` は `eslint-plugin-react` より 4〜7倍高速 (AST 再利用)
- lint 実行時間が短縮される見込み

### 新規 lint エラーの可能性

- `@eslint-react` の `recommended-typescript` には `eslint-plugin-react` にない新しいルールが含まれる可能性
- Phase 4 で洗い出して対処

---

## 5. テスト計画

- Phase 2 移行後に各パッケージで `pnpm lint` を実行
- Phase 3 移行後に `zenith-dashboard-react` で `pnpm lint` を実行
- CI (`pnpm lint` ターゲット) の通過を確認
- 新しい lint 警告/エラーが検出された場合はコードを修正

---

## 6. 対応履歴

| 日付       | 内容                                   | ステータス |
| ---------- | -------------------------------------- | ---------- |
| 2026-03-04 | 調査完了・実装計画書の作成             | ✅ 完了    |
| 2026-03-04 | Phase 1: 共有パッケージの作成          | ✅ 完了    |
| 2026-03-04 | Phase 2: 既存7パッケージの移行         | ✅ 完了    |
| 2026-03-04 | Phase 3: zenith-dashboard-react の移行 | ✅ 完了    |
| 2026-03-04 | Phase 4: 検証と仕上げ                  | ✅ 完了    |
