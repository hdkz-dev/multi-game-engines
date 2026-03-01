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

- [x] **Modular i18n (Pay-as-you-go)**: 言語データのモジュール分割によるバンドルサイズの極小化。(High)
  - [x] **物理的パッケージ分離**: `i18n-core`, `common`, `chess`, `shogi`, `engines`, `dashboard` への分離。
  - [x] **Zero-Any Policy**: `DeepRecord` と `I18nKey` による型安全性の完遂。
  - [x] **旧パッケージ廃止**: monolithic な `packages/i18n` の完全削除。
- [x] **Zenith Hardening & Multi-Engine Integration Base** (task_0001): (High)
  - [x] **Core Standardization**: `IBaseSearchInfo` 拡張、`ScoreNormalizer`, `PositionId` の実装。
  - [x] **Security Hardening**: `ProtocolValidator` 全数監査、全アセット SRI、`ConsentHandshake` 実装。
  - [x] **Flow Control**: `AbortSignal`, `onProgress`, `fetchWithRetry`, `ResumableFetch` 実装。
  - [x] **Environment Guard**: `EnvironmentDetector`, `ResourceGovernor`, `BackgroundThrottle` 実装。
  - [x] **Universal Storage**: `NodeFSStorage`, `MemoryStorage` の追加実装。
  - [x] **Pluggable Storage**: `EngineBridge` へのカスタムストレージ注入機能。
  - [x] **Advanced Features**: `EngineBatchAnalyzer` (Priority/Control), `BinaryVariantSelection` 実装。
  - [x] **Gomoku Domain**: `@multi-game-engines/domain-gomoku` 新設、Branded Types。
  - [x] **Reversi Precision**: `adapter-edax` 固有スコアパースと正規化。
- [x] **Zenith Robustness & 100% Coverage**: (Critical)
  - [x] **Extreme Coverage**: `core` パッケージで 98.4% 超のラインカバレッジを達成。
  - [x] **Middleware Isolation**: 故障したミドルウェアがエンジン本体を道連れにしない「絶縁」を実装。
  - [x] **Circular Protection**: `ProtocolValidator` に循環参照検知を追加し、スタックオーバーフローを防止。
  - [x] **Native Resilience**: `NativeCommunicator` にパケット分割対応のバッファリングを導入。
  - [x] **Async Integration**: `EngineBridge` の非同期アダプター生成対応。
- [x] **Opening Book Provider**: 定跡書 (`.bin`, `.db`) の独立ロードと IndexedDB 共有管理層の実装。
- [ ] **WASM Integration & SRI Sync**: 各エンジンの実バイナリ統合と SRI ハッシュの最終確定。
  - [ ] Stockfish (Chess)
  - [ ] やねうら王 (Shogi)
  - [ ] KataGo (Go)
  - [ ] Edax (Reversi)
  - [ ] Mortal (Mahjong)
- [x] **WebNN / WebGPU Generalization**: NNUE や CNN モデルのハードウェア加速レイヤーの汎用実装。
  - [x] `HardwareAccelerator` 診断ユーティリティの実装。
- [x] **Segmented SRI (Zenith Loader)**: 100MB 超の巨大ファイルの分割ダウンロードとインクリメンタルハッシュ検証。
  - [x] `SegmentedVerifier` による分割ハッシュ検証ロジックの実装。
  - [x] `EngineLoader` への統合（全量取得後の分割検証）。
- [ ] **API リファレンス**: TypeDoc と TSDoc による、全パッケージの技術ドキュメント自動生成。
- [x] **Generic Adapters**: `adapter-uci`, `adapter-usi`, `adapter-gtp` パッケージの作成。
- [x] **Extended Adapters (Prototypes)**: `adapter-edax`, `adapter-mortal`, `adapter-gnubg`, `adapter-kingsrow` のプロトタイプ実装。
- [x] **Ensemble Adapter (Swarm)**: `@multi-game-engines/adapter-ensemble` の高度化。
  - [x] プロトタイプと MajorityVote 実装。
  - [x] `BestScore`, `Weighted` 戦略の追加。
- [x] **Advanced Development Skills Integration**: 高度な開発スキルの統合 (ADR-056)。
  - `skills/` ディレクトリの標準化と `SKILL.md` 形式への統一。
  - `zenith-audit`, `doc-sync` スキルの新規実装。
  - `AI_WORKFLOW.md` へのスキル・アクティベーション層の追加。  - [ ] **Playwright E2E 拡充**: 各パッケージ（UI Monitor等）に対する網羅的な E2E テストの追加と自動化。
  - [ ] **Jules / Subagent ワークフロー**: Jules による大規模タスク委託とエージェント間レビュープロセスの確立。
  - [ ] **Release Automation**: Changesets と連携した詳細な `CHANGELOG.md` の自動生成とリリースの自動化。
  - [ ] **Security & SRI Integration**: ビルドプロセスにおける SRI 自動再計算とレジストリ同期の完全自動化。
- [x] **Asian Variants**: `adapter-xiangqi`, `adapter-janggi` の実装。
  - [x] `@multi-game-engines/domain-xiangqi` 新設。
  - [x] `@multi-game-engines/domain-janggi` 新設。
  - [x] `@multi-game-engines/adapter-xiangqi` 実装・ハードニング完了。
  - [x] `@multi-game-engines/adapter-janggi` 実装・ハードニング完了。
- [ ] **Multi-Runtime Bridge**: 同一アダプターで WASM と OS Native バイナリを自動切替。
  - [x] `NativeCommunicator` (Node.js/child_process) の基盤実装。
- [ ] **WebNN / WebGPU**: NNUE や CNN モデルのハードウェア加速の汎用化。
- [ ] **Zenith Loader**: 数百 MB 超の評価関数ファイルを分割ダウンロード・OPFS キャッシュ管理。
- [ ] **Incomplete Information**: `adapter-poker`, `adapter-bridge` の抽象化設計。

---

## 🛠️ 技術的負債・個別課題 (Pending Issues)

### 2026-02-26 更新 (実装担当: Federated i18n Architecture)

- [x] Federated i18n Architecture の実装
  - [x] 言語リソースの物理的パッケージ分離とドメイン隔離
  - [x] 全 40+ パッケージの新構成への完全移行
  - [x] i18n ロジックにおける Zero-Any 型安全性の達成

### 2026-02-23 更新 (実装担当: エンジンレジストリ導入)

- [x] [Registry] ADR-047 に基づくプラグイン可能なエンジンレジストリの実装
  - [x] Phase 1: 基盤構築 (IEngineRegistry, EngineBridge.addRegistry)
  - [x] Phase 2: 公式レジストリの実装 (@multi-game-engines/registry)
  - [x] Phase 3: アダプターのリファクタリング (ハードコードの排除)
  - [x] Phase 4: 検証と自動化 (SRI計算ツール)

### 🟡 Medium（品質・保守性）

- [x] **OPFSStorage 本実装**: `navigator.storage.getDirectory()` を用いた OPFS アクセスの本番実装。
- [ ] **UI Logic オフロード (Future)**: 超高頻度 `info` 出力時のメインスレッド保護のため、`ui-core` のロジックを UI Worker へ委譲するアーキテクチャの検討。
- [ ] **英語版ドキュメント不足**: `docs/en/` の拡充 (`DECISION_LOG.md`, `ROADMAP.md` 等)。
- [x] **Dashboard E2E デバッグ & 修復**: Dashboard (React/Vue) の E2E テストにおける SRI ミスマッチと初期化タイムアウトの解消。(2026-02-21)
- [x] **PR #38 Absolute Zenith Audit & 整合性同期**: (2026-02-23)
  - [x] **Reliability**: `EngineLoader` の ID 衝突防止 (セパレータ復帰) と `IndexedDB` ハング防止。
  - [x] **Leak Prevention**: `revokeAll()` 実装による Blob URL メモリリークの完全排除。
  - [x] **Type Safety**: `isIEngineAdapter` 検証の完備と `ValidI18nKey` によるエラーキーの型保証。
  - [x] **i18n**: `en.json` / `ja.json`への全エラーキーの完全同期。
  - [x] **Security**: USI パーサーへの PV/BestMove インジェクション対策適用。
  - [x] **Stability**: E2E テストの `networkidle` 排除と Locator 絞り込み。
  - [x] **Release**: `.changeset` によるリリースノート自動化準備。
  - [x] **API**: `ValidI18nKey` や `createFileStorage` 等の公開 API 整備 (Public API Polish)。
  - [x] **Documentation**: ADR-001〜046 の全エントリの形式統一とインデックス整理。
  - [x] **Zenith Polish (Final Re-Audit)**:
    - [x] **Structure**: 全パッケージの構成整理。`src/components/` 集約とアダプター命名規則の統一。
    - [x] **Reliability**: `loadResources` の設定ハッシュによるデデュプリケーション精密化。
    - [x] **Leak Prevention**: ロールバック時の既存リソース保護（スナップショット方式）。
    - [x] **Domain**: Mahjong での指し手なし（null）の正規化。
    - [x] **Security**: 全アダプターへの SRI 検証とプレースホルダー検知の横断適用。
    - [x] **Robustness**: GTP/USI パーサーにおける PV 解析時のバリデーション安全性向上（Safe Mapping）。
    - [x] **Build**: モノレポ依存関係の完全固定（react-hooks v7.0.0）と静的解析エラーの根絶。

### 2026-02-27 更新 (実装担当: Testing and Validation Expansion)

- [x] **Testing and Validation Expansion** (ADR-051)
  - [x] **A11y**: 全盤面コンポーネントへのキーボードナビゲーション実装とテスト。
  - [x] **Validation**: `engines.json` のスキーマバリデーション・テストの完備。
  - [x] **Error Handling**: エンジンファクトリ関数の `EngineError` 移行と i18n 対応。
  - [x] **Reliability**: SRI ミスマッチおよびタイムアウト時のエラーリカバリ検証テストの追加。
  - [x] **Quality**: 全パッケージを通じた Zero-Any ポリシーの再検証と `as any` のテスト隔離。
