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
- **Framework Adapters**: `ui-react`, `ui-vue`, `ui-elements` (Lit) を提供。Core のロジックを各フレームワークの流儀に合わせてラップし、100% の機能パリティを維持します。
- **Contract-driven UI**: エンジンからの出力は `Zod` スキーマによって実行時に検証され、UI のクラッシュを構造的に防止します。

---

## 🏁 フェーズ 2: 早期リリース戦略 (Stage 1) (進行中)

**目的**: 既存の npm/CDN 資産を統合し、実用的なツールとしての価値を早期に証明。

- [x] **Chess/Shogi 統合**: Stockfish / やねうら王のパブリック CDN ローダー実装。
- [x] **セキュリティ監査**: 「Refuse by Exception」ポリシーの確立と再帰的検証。
- [x] **Core-UI 連携**: 主要フレームワーク（React/Next.js/Vue）向け UI 基盤の提供。
- [ ] **Native Games 集結**: Gomoku, Checkers, Connect4 等の既存 MIT パッケージ統合。

---

## 🔥 フェーズ 3: 究極のパワーと制御 (Stage 2) (準備中)

**目的**: 自前ビルドパイプラインと AI 運用により、ブラウザ性能の限界を突破。

- [ ] **Build Pipeline**: Emscripten / Rust 最適化ビルド（SIMD128, Multithreading）の自動化。
- [x] **Turborepo 統合**: 並列実行とキャッシュによる高速なビルドパイプラインの確立。
- [ ] **Custom Distribution**: 自前 CDN (Cloudflare R2/Workers) によるバイナリ供給。
- [ ] **Release Automation**: `release-please` による完全自動リリースと CHANGELOG 生成。
- [ ] **Observability**: OpenTelemetry (OTel) 統合による実行時パフォーマンスの可視化。

---

## 📱 フェーズ 4: プラットフォーム拡大 (Stage 3)

**目的**: スマホアプリ等におけるネイティブ性能の提供。

- [ ] **Hybrid Bridge**: React Native / Capacitor 向けネイティブプラグインアダプターの実装。
- [ ] **Native Build**: Android NDK / iOS C++ ネイティブバイナリの統合。

---

## 💎 フェーズ 5: 究極の頂 (The Zenith Tier)

**目的**: 100% 自律的な品質維持と、世界最高水準の信頼性確立。

- [x] **Turborepo & CI Optimization**: CI 上での 100% 再現可能な高速実行環境。
- [ ] **Continuous Benchmarking**: `CodSpeed` 等による、PR 単位での性能劣化（NPS 低下）検知。
- [ ] **Self-Healing Docs**: `TypeDoc` による、コード変更に 1 秒も遅れない API リファレンス生成。
- [x] **Browser Matrix Verification**: `Playwright` による、実ブラウザ（各 OS エンジン）上での WASM 動作保証。
- [x] **Contract-driven Safety**: `Zod` 等による、Worker 通信境界でのランタイム検証の強制。
- [x] **Observability Integration**: 全 UI インタラクションとエンジン状態変化のテレメトリ同期。

---

## 🔮 未来のビジョン

- **WebNN Acceleration**: ハードウェアアクセラレーションによる次世代 NNUE エンジン。
- **P2P Engine Sharing**: 分散コンピューティングによる定跡生成ネットワーク。
- **Multi-Agent Analysis**: 複数エンジンによる同時解析とアンサンブル推論。
