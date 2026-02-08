# ADR-015: CDN 選定とエンジン配信戦略

- **ステータス**: 承認済み
- **日付**: 2026-02-06

## 1. コンテキスト (Context)

WASM バイナリは大容量（数 MB 〜 数十 MB）であり、かつ頻繁な更新は不要だが、高い可用性と低レイテンシでの配信が求められる。また、GPL エンジンを MIT プロジェクトから分離して配信する必要がある。

## 2. 決定 (Decision)

以下の 2 層の配信レイヤーを採用する：

### 2.1 Stage 1: 汎用 CDN (jsDelivr / unpkg)

- **対象**: npm に公開されている既存の WASM パッケージ（Stockfish など）。
- **用途**: クイックスタート。開発者が npm add するだけで動作する。
- **メリット**: インフラ構築不要、グローバルな配信網。
- **リンク例**: `https://cdn.jsdelivr.net/npm/stockfish.js@11.0.0/stockfish.js`

### 2.2 Stage 2: 独自 CDN (Cloudflare R2 + Workers)

- **対象**: 公式 npm が存在しないエンジン、または最新命令（SIMD/Threads）向けに最適化して自前ビルドしたバイナリ。
- **用途**: 「究極のパワー」プラン。
- **メリット**:
  - バージョン固定と不変性 (Immutability) の完全な制御。
  - SRI マニフェストの一括提供。
  - オリジン隔離 (COOP/COEP) ヘッダーの制御。
- **独自ドメイン**: `engines.multi-game-engines.dev`

## 3. 結果 (Consequences)

- **メリット**: 柔軟性と安定性の両立。ユーザーは複雑な自前ビルドをせずに、高品質なバイナリを利用可能。
- **デメリット**: 独自 CDN の維持管理コスト（Cloudflare R2 ストレージ費、Worker 実行費）が発生する。

## 4. 参照 (References)

- [ADR-016: 2段階リリース戦略](./016-two-stage-release.md)
- [インフラ構成ドキュメント](../../infrastructure/README.md)
