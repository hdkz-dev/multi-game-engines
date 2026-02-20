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

## 🚀 フェーズ 2: 第1段階リリース (進行中)

- [x] **SECURITY.md**: 非公開報告機能を活用したセキュリティポリシーの策定。
- [x] **adapter-stockfish**: UCI 16.1 対応とライフサイクルテスト。
- [x] **adapter-yaneuraou**: USI 7.5.0 対応。
- [x] **adapter-katago**: GTP プロトコル対応（囲碁エンジン基盤）。
- [x] **プロトコルパーサー**: 詰みスコア変換、インジェクション対策、および `startpos` キーワード対応。
- [x] **ユニットテスト**: 計 121 ケースの網羅的検証。
- [x] **品質保証 & 監査**: PR #1〜#24 を通じた超深層監査の完遂。全 41 スレッド、計 45 指摘事項をすべて解消（Zenith Tier）。
- [x] **ゼロ・エニーの完遂**: プロジェクト全域における `any` / `as any` の完全排除。
- [x] **パース・バリデーションの強化**: `UCIParser`, `USIParser`, `parseFEN`, `parseSFEN` におけるインデックス境界チェックと詳細エラーメッセージの実装完了。
- [x] **UI 基盤アーキテクチャ**: `ui-core` (Logic) と `ui-react` (Presentation) の分離実装。
- [x] **マルチフレームワーク UI**: `ui-vue` (Vue 3) および `ui-elements` (Web Components) の Zenith Tier 実装。
- [x] **多言語対応 (i18n)**: 言語リソースの `packages/i18n` への分離と、全 UI アダプターへの注入。
- [x] **契約駆動 UI**: Zod によるエンジン出力のランタイムバリデーション。
- [x] **楽観的 UI**: `CommandDispatcher` による状態同期の安定化。
- [x] **デザイントークン統一**: CSS Variables によるフレームワーク横断的なテーマ管理。
- [x] **セキュリティポリシー刷新**: SRI 必須化と「Refuse by Exception」の明文化。
- [x] **厳格な型安全性の追求 (Zenith Tier)**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, および `Project References` の全パッケージ適用。
- [x] **最新技術トレンドの追従 (Modernization)**:
  - [x] Vue 3.5+ `onWatcherCleanup` による副作用管理の最新化。
  - [x] モノレポ全域における `sideEffects` 最適化による Tree-shaking 効率の最大化。
- [x] **WASM対応の高度化**: Blob URL 環境下での WASM/NNUE 相対パス解決ロジックの実装（依存性注入パターンの適用）。
- [x] **UIコンポーネント拡充**: 評価値の時系列グラフの実装。
- [x] **UIコンポーネント拡充**: 思考ログの永続化表示。
  - [x] `requestAnimationFrame` による状態更新のスロットリング実装とユニットテストによる検証 (Performance/Reliability)。
  - [x] ネイティブ HTML `<table>` 要素による完全なセマンティクスとアクセシビリティの確保 (A11y Best Practice)。
  - [x] ユーザー操作を妨げない「スマート・オートスクロール」ロジックの実装 (UX Improvement).
- [x] **Node.js 24 & Turborepo 統合**: モノレポ全体のビルドパイプライン高速化と最新ランタイム環境の確立。
- [x] **デモ**: チェスと将棋のハイブリッド検討ダッシュボード。
  - [x] **Board UI**: 汎用的なボードコンポーネント (`<chess-board>`, `<shogi-board>`) の Web Components 実装。
  - [x] **Real-time Integration**: エンジンの探索状況とボード表示の同期（最善手のハイライト等）。
- [x] **超深層監査 (Zenith Tier Audit)**:
  - [x] 全プロトコルパーサーの異常系堅牢化（境界チェック・デフォルト値補完）。
  - [x] React/Vue 両フレームワークにおけるアクセシビリティ完全準拠 (ARIA, Focus, Live Regions)。
  - [x] Next.js 15/React 19/Vue 3.5 最新機能への追従と最適化。
  - [x] 全パッケージ全域にわたるドキュメント・実装の完全同期。
  - [x] Project-wide Zero-Any Policy の完遂とブランド型の再定義。
- [x] **究極のモジュール化とIP保護 (Modularization & IP Safety)**:
  - [x] UI パッケージの物理分離（`core`, `monitor`, `game`）とフレームワーク独立性の確保。
  - [x] 商標保護のための名称変更（`Othello` -> `Reversi`）の全域適用。
  - [x] `domain-reversi`, `domain-mahjong` の新設によるドメインロジックの完全分離。
  - [x] ハブパッケージ（`ui-react`, `ui-vue`）による統合インポート環境の整備。
- [x] **UI 品質とフレームワーク統合の昇華 (UI Quality & Integration Excellence)**:
  - [x] React 19 / Vue 3 / Lit における確実なプロパティ同期パターン (useLayoutEffect + Property Reflection) の確立。
  - [x] チェス・将棋盤面コンポーネントにおける網羅的なユニット・統合テスト（100%パス）の達成。
- [x] **PR #25 最終監査 & フォローアップ (Zenith Consolidation)**: 「Refuse by Exception」の全域適用、SSR 互換性、ESM 移行、およびレビュー指摘事項（バリデーション詳細化、テスト強化）の全対応。
- [x] **Zenith Tier 究極監査と型安全性の昇華 (Zenith Audit & Strict Type Hardening)**:
  - [x] 全マージ済み PR (#15, #21, #24, #25) の 100 以上のレビューポイントを再監査し、実装に反映。
  - [x] モノレポ全域での `exactOptionalPropertyTypes` の復旧と UI パッケージの型整合。
  - [x] `MonitorRegistry` 等のコア基盤における `any` の完全排除。
  - [x] 全エンジンアダプターにおける SRI ハッシュの `sha384` 標準化と TODO 追跡の開始。
- [ ] **API リファレンス**: TypeDoc と TSDoc による、全パッケージの技術ドキュメント自動生成。

---

## 🛠️ 技術的負債・個別課題 (Pending Issues)

> 2026-02-20 更新。2026-02-19 全体レビュー ([実装計画書](implementation_plans/project-review-improvements.md)) + 2026-02-20 フォローアップレビューの結果を統合。

### 🔴 Critical（法的・CI整合性）

- [ ] **LICENSE ファイル欠落**: ルートに MIT ライセンスファイルが存在しない。31パッケージ中30パッケージで `LICENSE` ファイルが物理的に欠落。
- [ ] **license フィールド欠落**: 13パッケージ（`domain-*` 5件、`ui-chess*` 4件、`ui-shogi*` 4件）で `package.json` に `license` フィールドがない。
- [ ] **release.yml Node.js 不整合**: `.github/workflows/release.yml` が Node.js 22 を使用。`ci.yml` (24)、`.node-version` (24.13.0)、`package.json` (`>=24.0.0`) と不一致。
- [ ] **不要ファイルの Git 管理**: `review_audit_raw.md`, `pr_review_comments*.json`, `pr_view.json`, `status.txt`, `opencode_test.txt` がリポジトリに混入。`.gitignore` への追加と `git rm --cached` が必要。
- [ ] **`ui-react` ESLint 設定欠落**: `packages/ui-react/` に `eslint.config.mjs` が存在せず、`pnpm run lint` が `TypeError` で失敗。CI の lint チェック失敗の根本原因。

### 🟠 High（リリース準備）

- [ ] **全アダプター SRI プレースホルダーハッシュ**: `sha384-*Placeholder` が全5アダプター、計9箇所に残存（`adapter-stockfish` 2箇所、`adapter-yaneuraou` 3箇所、`adapter-edax` 1箇所、`adapter-mortal` 1箇所、`adapter-katago` 2箇所）。本番用バイナリのハッシュ値への置換が必要。
- [ ] **README 欠落**: 20パッケージに `README.md` が存在しない（`adapter-gtp/uci/usi`、`domain-*` 5件、`ui-chess*` 4件、`ui-shogi*` 4件、`ui-*-core/monitor` 4件）。
- [ ] **pnpm-workspace.yaml 不整合**: `examples/*` が `pnpm-workspace.yaml` には含まれるが、ルート `package.json` の `workspaces` には未記載。
- [x] **ADR 欠番**: ~~ADR-003〜013 が未登録~~。`DECISION_LOG.md` に欠番経緯の注記を追加済み。
- [ ] **Dependabot/Renovate 未設定**: `.github/dependabot.yml` が存在せず、依存関係の自動更新が行われていない。GitHub Security Alerts に脆弱性2件あり。

### 🟡 Medium（品質・保守性）

- [ ] **lint warning**: `ui-vue-monitor/src/useEngineMonitor.ts` に未使用インポート `useEngineUI` が残存。
- [ ] **`as unknown as` 残存**: プロダクションコード3箇所（`MonitorRegistry.ts`(2), `ResourceInjector.ts`(1), `EngineError.ts`(1)）。Zenith Standard（バリデータ関数経由）への置換を検討。
- [ ] **OPFSStorage TODO**: `navigator.storage.getDirectory()` を用いた本番実装が未完了（現状15行のスタブ）。ARCHITECTURE.md では主要機能として記載。
- [ ] **`i18n` パッケージに `typecheck` スクリプト欠落**: `pnpm turbo typecheck` でスキップされる。
- [ ] **`main`/`types` フィールド欠落**: 7パッケージ（`domain-chess/go/mahjong/reversi/shogi`, `ui-chess`, `ui-shogi`）に `main` フィールドがない。`exports` のみで ESM は問題ないが、CJS 互換性に影響。
- [ ] **Storybook `as any`**: `ui-vue-monitor/stories/EngineMonitorPanel.stories.ts:16` で `as any` を使用。
- [ ] **テレメトリ拡張**: UI 上のインタラクション（クリック、ホバー等）の計測ポイント拡充。
- [ ] **UI Logic オフロード (Future)**: 超高頻度 `info` 出力時のメインスレッド保護のため、`ui-core` のロジックを UI Worker へ委譲するアーキテクチャの検討。
- [ ] **英語版ドキュメント不足**: `docs/en/` に `ARCHITECTURE.md` と `TECHNICAL_SPECS.md` のみ。`DECISION_LOG.md`, `ROADMAP.md`, `ZENITH_STANDARD.md` の英語版が必要。
- [ ] **.DS_Store の Git 追跡除外**: `git rm --cached` による除外（現在は `.gitignore` に登録済みだが、既追跡ファイルの除外は未実施）。

---

## 🔥 フェーズ 3: 第2段階・究極の最適化 (検討中)

- [ ] **Multi-Runtime Bridge**: 同一アダプターで WASM と OS Native バイナリを自動切替。
- [ ] **Cloud Engine Relay**: 低スペック端末向けに外部 GPU サーバーへ演算を委託。
- [ ] **Engine Registry**: SRI ハッシュとバージョンを中央管理し、URL 指定を不要にする。
- [ ] **巨大 eval-data 配信**: 数百 MB 超の評価関数ファイルを分割ダウンロード・キャッシュ管理。
- [ ] **WebNN / WebGPU**: NNUE や CNN モデルのハードウェア加速の汎用化。
- [x] **Generic Adapters**: `adapter-uci`, `adapter-usi`, `adapter-gtp` パッケージの作成。
- [ ] **Asian Variants**: `adapter-xiangqi`, `adapter-janggi` のプロトタイプ実装。
- [ ] **Incomplete Information**: `adapter-poker`, `adapter-bridge` の抽象化設計。
- [ ] **adapter-gnubg**: バックギャモンエンジンの基本統合と WASM ポートの調査。
- [ ] **adapter-checkers**: チェッカーエンジンの統合とテーブルベース対応。
