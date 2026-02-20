# 実装計画書: ハイブリッド・ダッシュボードと盤面コンポーネント

## 1. 目的

Zenith ハイブリッド・ダッシュボードのプロトタイプを完成させるため、フレームワークに依存しない盤面コンポーネント（チェス・将棋）を実装し、既存の Engine Bridge インフラストラクチャと統合します。

## 2. アーキテクチャ

盤面コンポーネントは、React、Vue、およびバニラ環境での再利用性を最大化するため、`@multi-game-engines/ui-elements` 内に Web Components (Lit) として実装します。

### 2.1. 盤面コンポーネント (`ui-elements`)

- **`<chess-board>`**:
  - プロパティ: `fen` (Branded FEN) - 現在の局面。
  - プロパティ: `last-move` (string) - ハイライトする指し手（例: "e2e4"）。
  - プロパティ: `orientation` ("white" | "black") - 盤面の向き。
- **`<shogi-board>`**:
  - プロパティ: `sfen` (Branded SFEN) - 現在の局面。
  - プロパティ: `last-move` (string) - ハイライトする指し手（例: "7g7f"）。
  - 機能: 持ち駒（駒台）のレンダリング。

### 2.2. 駒アセット

- **チェス**: 標準的な SVG ピースセットを使用（コンポーネント内に文字列として埋め込み）。
- **将棋**: 高品質な SVG 文字または漢字レンダリングを使用。

### 2.3. フレームワーク統合

- `@multi-game-engines/ui-react`: `ChessBoard` および `ShogiBoard` の React ラッパーをエクスポート。
- `@multi-game-engines/ui-vue`: `ChessBoard` および `ShogiBoard` の Vue ラッパーをエクスポート。

## 3. ダッシュボードへの統合 (`examples/zenith-dashboard-react`)

- 現在の `ChessGrid` / `ShogiGrid` プレースホルダーを、実際の `<chess-board>` / `<shogi-board>` に置き換えます。
- エンジンの `bestPV` 出力を盤面の `last-move` プロパティに接続します。
- `StatCard` を更新し、`EngineMonitorPanel` の共有状態から得られるリアルタイム指標（NPS, Nodes, Depth）を表示します。

## 4. 技術仕様

- **パフォーマンス**: レイアウトには CSS Grid を使用。ベクター形式の SVG 駒により、ズームレベルに関わらず鮮明な表示を維持。
- **アクセシビリティ**:
  - 現在の手番や駒の損得（将棋）に対する ARIA ラベルの付与。
  - キーボードによるマスのフォーカス移動（将来的な拡張を見据えた設計）。
- **型安全性**: `FEN` および `SFEN` の Branded Types を使用した厳格な Props 定義。

## 5. 実施ステップ

1.  [x] `parseFEN` / `parseSFEN` ユーティリティを `packages/ui-core` に追加。
2.  [x] `packages/ui-elements` に `<chess-board>` を実装。
3.  [x] `packages/ui-elements` に `<shogi-board>` を実装。
4.  [x] 駒アセット (SVG / 高品質フォント) を使用したレンダリングの実装。
5.  [x] React/Vue 用のラッパーコンポーネントを作成。
6.  [x] Zenith Dashboard デモを更新し、エンジンの思考と盤面を同期。
7.  [x] 盤面のレンダリングロジック（FEN/SFEN からグリッドへの変換）のユニットテストを追加。
8.  [x] PR #24 レビュー指摘事項（A11y ローカライズ、コード分割最適化、型安全性の強化）の完全適用。
