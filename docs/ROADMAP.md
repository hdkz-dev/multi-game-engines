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

## 🏁 フェーズ 2: 早期リリース戦略 (Stage 1) (進行中)

**目的**: 既存の npm/CDN 資産を統合し、実用的なツールとしての価値を早期に証明。

- [x] **Chess/Shogi 統合**: Stockfish / やねうら王のパブリック CDN ローダー実装。
- [x] **セキュリティ監査**: 「Refuse by Exception」ポリシーの確立と再帰的検証。
- [ ] **Native Games 集結**: Gomoku, Checkers, Connect4 等の既存 MIT パッケージ統合。
- [ ] **Core-UI 連携**: 主要フレームワーク（React/Next.js）向け React Hooks 等の提供。

---

## 🔥 フェーズ 3: 究極のパワーと制御 (Stage 2)

**目的**: 自前ビルドパイプラインにより、ブラウザ性能の限界を突破。

- [ ] **Build Pipeline**: Emscripten / Rust 最適化ビルド（SIMD128, Multithreading）の自動化。
- [ ] **Custom Distribution**: 自前 CDN (Cloudflare R2/Workers) によるバイナリ供給。
- [ ] **Performance Tuning**: 各エンジンの探索効率、メモリ消費の限界突破。

---

## 📱 フェーズ 4: プラットフォーム拡大 (Stage 3)

**目的**: スマホアプリ等におけるネイティブ性能の提供。

- [ ] **Hybrid Bridge**: React Native / Capacitor 向けネイティブプラグインアダプターの実装。
- [ ] **Native Build**: Android NDK / iOS C++ ネイティブバイナリの統合。
- [ ] **Desktop Integration**: Electron / Tauri 向けバックエンド接続。

---

## 🔮 未来のビジョン

- **WebNN Acceleration**: ハードウェアアクセラレーションによる次世代 NNUE エンジン。
- **P2P Engine Sharing**: 分散コンピューティングによる定跡生成ネットワーク。
- **Multi-Agent Analysis**: 複数エンジンによる同時解析とアンサンブル推論。
