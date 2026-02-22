# プロジェクト・バックログ (TASKS.md)

## 🏗️ フェーズ 1: コア・フレームワークの実装 (完了)

- [x] **基本型システム**: Branded Types (FEN, Move) の確立。
- [x] **EngineBridge**: アダプター登録とライフサイクル管理 (`dispose`)。
- [x] **EngineFacade**: 排他制御と永続リスナー (`onInfo`)。
- [x] **CapabilityDetector**: SIMD/Threads 検出の検証。
- [x] **FileStorage**: OPFS / IndexedDB ストレージの完全実装。
- [x] **EngineLoader**: SRI 必須化と 30s タイムアウト。
- [x] **WorkerCommunicator**: バッファリングと例外伝播。

---

## 🚀 フェーズ 2: 第1段階リリース (完了)

- [x] **SECURITY.md**: 非公開報告機能を活用したセキュリティポリシーの策定。
- [x] **adapter-stockfish**: UCI 16.1 対応とライフサイクルテスト。
- [x] **adapter-yaneuraou**: USI 7.5.0 対応。
- [x] **adapter-katago**: GTP プロトコル対応（囲碁エンジン基盤）。
- [x] **ユニットテスト**: 計 160 ケース以上（15パッケージ）の網羅的検証。
- [x] **品質保証 & 監査**: PR #1〜#25 を通じた超深層監査の完遂（Zenith Tier）。
- [x] **マルチフレームワーク UI**: `ui-react`, `ui-vue`, `ui-elements` の物理分離と Zenith 品質実装。
- [x] **WASM対応の高度化**: Blob URL 環境下での WASM/NNUE 依存性注入パターンの確立。
- [x] **PR #25 最終監査 & フォローアップ (Zenith Consolidation)**: 「Refuse by Exception」の全域適用、SSR 互換性、ESM 移行。
- [x] **Review Remediation (2026-02-20-extended)**:
  - [x] **Security**: GTP/KingsRow 等での SRI 検証強制。
  - [x] **Security**: 全コマンド生成箇所への `assertNoInjection` 適用。
  - [x] **Privacy**: `truncateLog` による局面データの露出制限 (ADR-038)。
  - [x] **Type Hardening**: ブランド型階層化による `GOMove`/`ShogiMove` 等の衝突解消とキャスト廃止。
  - [x] **Reliability**: Vue ダッシュボードに SSR ガードを追加し、非同期初期化エラーを捕捉。

---

## 🔥 フェーズ 3: 第2段階・究極の最適化 (進行中)

- [ ] **API リファレンス**: TypeDoc と TSDoc による、全パッケージの技術ドキュメント自動生成。
- [ ] **WASM Integration**: 各エンジンの実 WASM バイナリ統合と SRI ハッシュの確定。
  - [ ] Stockfish (Chess)
  - [ ] やねうら王 (Shogi)
  - [ ] KataGo (Go)
  - [ ] Edax (Reversi)
  - [ ] Mortal (Mahjong)
- [x] **Generic Adapters**: `adapter-uci`, `adapter-usi`, `adapter-gtp` パッケージの作成。
- [x] **Extended Adapters (Prototypes)**: `adapter-edax`, `adapter-mortal`, `adapter-gnubg`, `adapter-kingsrow` のプロトタイプ実装。
- [ ] **Ensemble Adapter (Swarm)**: `@multi-game-engines/adapter-ensemble` の高度化。
  - [x] プロトタイプと MajorityVote 実装。
  - [ ] `BestScore`, `Weighted` 戦略の追加。
- [ ] **Asian Variants**: `adapter-xiangqi`, `adapter-janggi` のプロトタイプ実装。
- [ ] **Multi-Runtime Bridge**: 同一アダプターで WASM と OS Native バイナリを自動切替。
- [ ] **WebNN / WebGPU**: NNUE や CNN モデルのハードウェア加速の汎用化。
- [ ] **Zenith Loader**: 数百 MB 超の評価関数ファイルを分割ダウンロード・OPFS キャッシュ管理。
- [ ] **Incomplete Information**: `adapter-poker`, `adapter-bridge` の抽象化設計。

---

## 🛠️ 技術的負債・個別課題 (Pending Issues)

> 2026-02-21 更新。

### 🟡 Medium（品質・保守性）

- [x] **OPFSStorage 本実装**: `navigator.storage.getDirectory()` を用いた OPFS アクセスの本番実装。
- [ ] **UI Logic オフロード (Future)**: 超高頻度 `info` 出力時のメインスレッド保護のため、`ui-core` のロジックを UI Worker へ委譲するアーキテクチャの検討。
- [ ] **英語版ドキュメント不足**: `docs/en/` の拡充 (`DECISION_LOG.md`, `ROADMAP.md` 等)。
- [x] **Dashboard E2E デバッグ & 修復**: Dashboard (React/Vue) の E2E テストにおける SRI ミスマッチと初期化タイムアウトの解消。(2026-02-21)
- [ ] **PR #38 Absolute Zenith Audit & 整合性同期**:
  - [x] **Reliability**: `EngineLoader` の ID 衝突防止 (セパレータ復帰) と `IndexedDB` ハング防止。
  - [x] **Type Safety**: `isIEngineAdapter` 検証の完備と `registerAdapterFactory` の契約適正化。
  - [x] **Protocol**: GTP `resign` の null 正規化と Go バリデーション順序の是正。
  - [x] **Stability**: E2E テストの `networkidle` 排除と Locator 絞り込みによる堅牢化。
  - [x] **Async Safety**: ESLint `no-floating-promises` の全域適用。
  - [x] **Documentation**: ADR-044, ADR-045 の策定。 (2026-02-23)
