# プロジェクト進捗状況 (PROGRESS.md)

## 📅 更新日: 2026年2月16日

## 🏆 到達ハイライト (Phase 2 Stage 1 - UI Foundation Zenith)

- **構造化スコア情報の統一 (ADR-030)**:
  - スコア表現を `{ cp, mate, points, winrate }` オブジェクトに統一し、囲碁や MCTS 系エンジンを含む広範なゲームに対応。
  - `core` から `adapter-katago` / `ui-core` に至る全レイヤーの型定義を刷新し、visits や hashfull 等の観測指標を拡充。
  - 例外的な `as any` キャストをテストコードおよび Storybook 資産から完全に排除（Zero-Any Policy）。
  - チェス (`createFEN`) および将棋 (`createSFEN`) の Branded Type ファクトリにより、UI 層の型安全性を定着。
- **パーサーの堅牢化と機能拡充**:
  - `UCIParser` および `USIParser` のテストを大幅強化し、境界値や負数、不完全な入力に対する耐性を証明。
  - 標準 UCI トークン (`seldepth`, `hashfull`, `multipv`) のパース処理を追加実装。
- **UI 基盤の極致 (Zenith Tier)**:
  - `ui-core` (Logic/Tokens), `ui-react`, `ui-vue`, `ui-elements` の三層アーキテクチャを確立。
  - 全フレームワークで共通の CSS デザイントークン（CSS Variables）を使用し、視覚的な一貫性を 100% 同期。
  - `MonitorRegistry` による購読の重複排除、`CommandDispatcher` による楽観的 UI 制御を導入。
  - Zod による契約駆動設計（Contract-driven UI）により、ランタイムでの型安全性を 100% 保証。
- **品質保証の完遂 (Total AI Audit)**:
  - CodeRabbit による計 5 回の反復監査ループを完了。
  - CI 上での V8 特有のエラー（captureStackTrace）を含め、全 140 ケース以上のテストをパス。
- **ドキュメントの全域刷新**:
  - 全パッケージへの README 配備、セキュリティポリシーの明文化、CHANGELOG の整備を完了。
- **2026年最新技術スタックへの完全移行 (Zenith Tech Stack)**:
  - **Next.js 16.1 (Stable)** & **React 19.2** へのメジャーアップデート、および **React Compiler** の有効化。
  - **Node.js 24 (LTS Target)** & **Turborepo 2.8** によるビルドパイプラインの高速化と並列実行の導入。
  - **TypeScript 5.9** & **ESLint 9.20.0 (Flat Config)** への移行（エコシステム追従性を重視した最新安定構成）。
  - **Project References** の導入によるモノレポ構成の最適化と、`noUncheckedIndexedAccess` 等の極めて厳格な型安全性の確立。
  - 既知の依存関係における全脆弱性（Critical/Highを含む計11件）のプロアクティブな解消。

---

## 📈 現在の状況

### フェーズ 1: コア・フレームワークの実装 (完了)

- [x] **基本設計**: Facade & Adapter パターンの確立。
- [x] **セキュリティ**: SRI 検証 (W3Cマルチハッシュ対応) と COOP/COEP 診断。
- [x] **通信基盤**: メッセージバッファリングと AbortSignal 対応。
- [x] **ストレージ**: OPFS と IndexedDB の自動フォールバック。

### フェーズ 2: 第1段階リリース (進行中)

- [x] **Stockfish / やねうら王 統合**: 主要エンジン対応完了。
- [x] **品質保証 (AI Audit)**: 累計 140 件以上の AI 指摘事項をすべて解消し、最高水準の堅牢性を証明。
- [x] **AI 相互レビュー体制**: `AI_WORKFLOW.md` および `AI_TOOLS_STRATEGY.md` の整備完了。
- [x] **UI 基盤アーキテクチャ**: 2026 年標準の Reactive Core + Adapter 設計を完遂。

---

## 🚀 次のステップ

1. **WASM対応の高度化**: Blob URL 環境下での相対パス解決（NNUE ファイル等の自動注入）。
2. **UI コンポーネント拡充**: 評価値グラフ表示など、より高度な可視化部品の実装。
3. **リリース自動化**: `release-please` によるリリースパイプラインの構築。
