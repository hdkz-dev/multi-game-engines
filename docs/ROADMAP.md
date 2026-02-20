# プロジェクト・ロードマップ (2026-2027)

本プロジェクトは、Web標準を極限まで活用し、ブラウザ上で業界最高水準のゲーム探索性能を提供することを目指します。

---

## 🚀 フェーズ 1: 基盤構築と設計の極致 (完了)

**目的**: 10年後も古くならない、堅牢なアーキテクチャと型システムの確立。

- [x] **モノリポ構成の定義**: npm workspaces による `core` と `adapters` の分離。
- [x] **究極の型安全性**: `any` の完全排除、Branded Types によるドメイン保護。
- [x] **Facade パターン設計**: `IEngine` と `IEngineAdapter` の分離による利用者 API の洗練。
- [x] **ライセンス隔離戦略**: アダプターを MIT 化し、バイナリを動的ロードする法的クリーン環境の設計。
- [x] **EngineBridge & BaseAdapter Implementation**: コアロジックの完成。
- [x] **CapabilityDetector**: OPFS, WebNN, WASM SIMD/Threads の自動診断。

---

## 🎨 UI アーキテクチャ (2026 Standard)

本プロジェクトの UI 層は、特定のフレームワークへの依存を最小限に抑えつつ、最高のパフォーマンスを実現する二層構造を採用しています。

- **Reactive Core (`ui-core`)**: フレームワーク非依存のビジネスロジック。状態管理、NPS スケーリング、局面解析、および `requestAnimationFrame` による描画最適化を担います。
- **Framework Adapters**: `ui-react`, `ui-vue`, `ui-elements` (Lit) を提供。基盤 (core)、監視ツール (monitor)、ゲーム UI (game) にモジュール化されており、必要なコンポーネントのみを最小限の依存関係で利用可能です。
- **Contract-driven UI**: エンジンからの出力は `Zod` スキーマによって実行時に検証され、UI のクラッシュを構造的に防止します。

---

## 🏁 フェーズ 2: 早期リリース戦略 (Stage 1 - UI Foundation) (完了)

**目的**: 主要エンジンと UI 基盤の統合を完了し、実用的な分析ツールとしての基盤を確立。

- [x] **Chess/Shogi 統合**: Stockfish / やねうら王のパブリック CDN ローダー実装。
- [x] **セキュリティ監査**: 「Refuse by Exception」ポリシーの確立と再帰的検証。
- [x] **Core-UI 連携**: 主要フレームワーク（React/Next.js/Vue）向け UI 基盤の提供。
- [x] **Thinking Log**: 永続化ログとパフォーマンス最適化の実装。
- [x] **Board UI**: フレームワーク非依存のチェス・将棋盤コンポーネント。
- [x] **IP Safety**: 全域での Reversi への改称と商標リスク排除。

---

## 🔥 フェーズ 3: 究極のパワーと制御 (Stage 2) (進行中)

**目的**: 自前ビルドパイプラインと AI 運用により、ブラウザ性能の限界を突破。

- [ ] **Build Pipeline**: Emscripten / Rust 最適化ビルド（SIMD128, Multithreading）の自動化。
- [x] **Turborepo 統合**: 並列実行とキャッシュによる高速なビルドパイプラインの確立。
- [x] **Modular Split**: UI パッケージの物理分離（core/monitor/game）による「Pay-as-you-go」アーキテクチャの完成。
- [ ] **Custom Distribution**: 自前 CDN (Cloudflare R2/Workers) によるバイナリ供給。
- [ ] **Release Automation**: `release-please` による完全自動リリースと CHANGELOG 生成。
- [ ] **Observability**: OpenTelemetry (OTel) 統合による実行時パフォーマンスの可視化。
- [ ] **Release Readiness (2026-02-19 レビュー指摘)**: npm 公開に向けたメタデータ整備。
  - [ ] ルート LICENSE ファイル作成、全パッケージの `license` フィールド追加。
  - [ ] 全アダプターの SRI ダミーハッシュ (`sha256-dummy*`) 刷新。
  - [ ] 20パッケージへの README.md 追加。
  - [ ] CI (`release.yml`) の Node.js バージョン不整合の修正。
- [ ] **Extended Adapters**:
  - **Board Games**: バックギャモン (gnubg), チェッカー (KingsRow), リバーシ (Edax)。
  - **Asian Variants**: 中国将棋 (Xiangqi), チャンギ (Janggi)。
  - **Incomplete Information**: ポーカー (DeepStack), ブリッジ, 花札。
- [ ] **Multi-Engine Ensemble**: 同一局面を複数エンジンで同時解析する UI/Logic の提供。

---

## 📱 フェーズ 4: プラットフォーム拡大 (Stage 3)

**目的**: スマホアプリ等におけるネイティブ性能の提供。

- [ ] **Hybrid Bridge**: React Native / Capacitor 向けネイティブプラグインアダプターの実装。
- [ ] **Native Build**: Android NDK / iOS C++ ネイティブバイナリの統合。

---

## 💎 フェーズ 5: 究極の頂 (The Zenith Tier)

**目的**: 100% 自律的な品質維持と、世界最高水準の信頼性確立。

- [x] **Turborepo & CI Optimization**: CI 上での 100% 再現可能な高速実行環境。
- [x] **超深層監査 (Zenith Tier Audit)**: 全 14 パッケージにわたる徹底的な A11y / ロジック監査。
- [ ] **Continuous Benchmarking**: `CodSpeed` 等による、PR 単位での性能劣化（NPS 低下）検知。
- [ ] **Self-Healing Docs**: `TypeDoc` による、コード変更に 1 秒も遅れない API リファレンス生成。
- [x] **Browser Matrix Verification**: `Playwright` による、実ブラウザ上での WASM 動作保証。
- [x] **Contract-driven Safety**: `Zod` による、Worker 通信境界でのランタイム検証。
- [x] **Zero-Any Policy**: プロダクションコードにおける any 型の完全排除。

---

## 🔮 未来のビジョン

- **WebNN Acceleration**: ハードウェアアクセラレーションによる次世代 NNUE エンジン。
- **P2P Engine Sharing**: 分散コンピューティングによる定跡生成ネットワーク。
- **Multi-Agent Analysis**: 複数エンジンによる同時解析とアンサンブル推論。
