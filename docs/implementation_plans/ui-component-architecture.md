# UI コンポーネント実装計画書 (UI Component Architecture)

## 1. 設計哲学 (Design Philosophy)

### 1.1. 疎結合と再利用性

- **Logic / View の分離**: `ui-core` が全てのビジネスロジック（状態管理、RAFスケジューリング、正規化）を担い、`ui-react` 等の表現層は「データの表示」と「ユーザー入力のイベント発信」のみに専念する。
- **Headless アプローチ**: コンポーネントは最小限のデフォルトスタイルを持ち、利用者が CSS 変数や Tailwind クラスで容易に見た目を変更できるようにする。

### 1.2. 究極のパフォーマンス

- **非同期更新の最適化**: エンジンからの毎秒数百回の `info` 出力に対し、`ui-core` の RAF 同期を利用してブラウザの再描画負荷を制御する。
- **メモ化の徹底**: `useMemo`, `useCallback` を適切に配置し、大規模な指し手リスト（PV）の更新時も必要な最小範囲のみを再レンダリングする。

## 2. 技術選定 (Tech Stack)

| 役割              | 選定技術              | 理由                                                                                  |
| :---------------- | :-------------------- | :------------------------------------------------------------------------------------ |
| **Styling**       | Tailwind CSS          | ユーティリティ優先アプローチによる柔軟なカスタマイズと、ビルド後の CSS サイズ最小化。 |
| **Accessibility** | Radix UI (Primitives) | WAI-ARIA 準拠の基盤を提供し、キーボード操作やスクリーンリーダー対応を容易にする。     |
| **Icons**         | Lucide React          | 軽量かつ一貫性のあるアイコンセット。                                                  |
| **Documentation** | Storybook             | コンポーネント駆動開発 (CDD) の中心地。                                               |

## 3. アクセシビリティ指針 (Accessibility Guidelines)

- **WCAG 2.2 Level AA 準拠**: コントラスト比、フォーカス管理、アリアラベルの徹底。
- **キーボードナビゲーション**: 全てのインタラクティブな要素（探索停止ボタン、オプション変更等）をキーボードのみで操作可能にする。
- **スクリーンリーダー**: `aria-live="polite"` を使用し、探索の重要な変化（詰みの発見など）を適切に通知する。

## 4. 実装ロードマップ (Implementation Roadmap)

### Phase 1: Atoms (最小単位)

- `ScoreBadge`: 評価値（cp/mate）を表示する色分けされたバッジ。
- `DepthIndicator`: 探索深さを表示するインジケーター。
- `StatItem`: NPS や Nodes などの数値情報。

### Phase 2: Molecules (複合単位)

- `PVList`: マルチPVに対応した読み筋リスト。指し手ごとのナビゲーション付き。
- `EngineControlBar`: 開始/停止/設定ボタンのセット。

### Phase 3: Organisms (完成部品)

- `EngineMonitorPanel`: 上記を統合した、解析ダッシュボードのメインパネル。

## 5. 開発ワークフロー

1. `ui-core` でロジックをテスト（Vitest）。
2. Storybook で `MockEngine` を用いて視覚的なバリエーション（ダークモード、狭い画面等）を確認。
3. `packages/ui-react` で実装し、型チェックとビルド検証を行う。
