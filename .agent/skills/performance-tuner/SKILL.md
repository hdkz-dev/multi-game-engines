---
name: performance-tuner
description: Next.js/React アプリケーションのパフォーマンスを最適化するスキル
---

# Performance Tuner Skill

このスキルは、アプリケーションの「速度」と「効率」を追求するための専門家です。
レンダリングの無駄、巨大なバンドルサイズ、非効率な読み込み戦略を特定し、改善案を提示します。

## 主な機能

1. **Bundle Analysis (バンドル分析)**
   - ビルド結果や `@next/bundle-analyzer` を使用し、不必要に巨大なライブラリを特定します。
   - Tree Shaking が効いていない import 文（例: `import { x } from 'huge-lib'` vs `import x from 'huge-lib/x'` - `sideEffects` の設定に依存）を指摘します。

2. **Lazy Loading Strategy (遅延読み込み戦略)**
   - ファーストビューに含まれない重いコンポーネント（モーダル、複雑なチャート、画面外のリスト）を特定します。
   - `next/dynamic` を用いた動的インポート（Code Splitting）の導入を提案します。

3. **Render Optimization (レンダリング最適化)**
   - React DevTools やコード解析に基づき、不要な再レンダリングの原因を探ります。
   - `useMemo`, `useCallback` の適切な適用や、`React.memo` 化による最適化を提案します。
   - 画像リソースに対する `next/image` の適切な使用（`sizes`, `priority` 属性）を確認します。

## 使用例

- 「アプリが重いので分析して」
- 「このページの表示速度を上げたい」
- 「ビルドサイズを減らす方法はある？」

## チェックリスト

- [ ] `next/image` を使用しているか？（`<img>` タグの直接使用は避ける）
- [ ] 初期表示に不要なコンポーネントは `dynamic()` で読み込んでいるか？
- [ ] 重い計算処理は `useMemo` でラップされているか？
- [ ] 本番ビルド (`pnpm build`) でのアセットサイズは許容範囲内か？
