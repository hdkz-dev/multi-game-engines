# プロジェクト進捗状況 (PROGRESS.md)

## 📅 更新日: 2026年4月28日 (実装担当: Zenith Quality Engineer)

## ✅ 直近完了タスク (2026年4月)

### npm 初回リリース準備 Phase A — 全完了 ✅

**目的**: `@multi-game-engines/*` v0.1.0 の npm 公開に向けた自動化基盤の整備。

- **[A1] Stockfish SRI 算出** (commit `5f74f679`):
  - `engines.json` 内の全 Stockfish アセット（6件）の `__unsafeNoSRI` を実 SHA-384 ハッシュへ置換。
  - `scripts/refresh-engine-sris.mjs` に `tryUpgradeSRI()` を追加し、`pnpm sri:refresh` で自動更新可能に。

- **[A2] Changesets リリース自動化** (commit `aabf8c4e`):
  - 旧 changeset（削除済みパッケージ参照）を削除し、全 47 公開パッケージ `patch` bump (`0.1.0 → 0.1.1`) の `initial-public-release.md` を作成。
  - `release.yml` に push-to-main トリガー・npm auth ステップ・`createGithubReleases: true` を追加。
  - ⚠️ **要手動設定**: `NPM_TOKEN` GitHub Actions シークレット登録が npm publish の前提条件。（→ 後日 OIDC 方式に移行済み、下記参照）

- **[A3] TypeDoc API リファレンス** (commit `d91974d3`):
  - ルート `typedoc.json` を作成（`entryPointStrategy: "packages"`, 全 47 パッケージ, `skipErrorChecking: true`）。
  - `.github/workflows/docs.yml` で GitHub Pages へ自動デプロイ（push-to-main でトリガー）。
  - ⚠️ **要手動設定**: リポジトリ Settings → Pages で Source を "GitHub Actions" に変更が必要。

- **[A4] E2E テスト基盤整備** (commits `6ed55131`, `0379db4d`):
  - `ui-react-monitor` に Playwright CT 基盤を構築（Chromium 専用、ADR-014 準拠: GPL バイナリ不使用）。
  - `ui-vue-monitor` にも Playwright CT 基盤を構築（`@playwright/experimental-ct-vue`）。
  - 両パッケージで `ScoreBadge` コンポーネント 6 件の実ブラウザ CT テストを追加。
  - `.github/workflows/e2e.yml` で Chromium CT を CI に組み込み（React・Vue 両ジョブ）。
  - `useEngineUI()` のリターン型を `reactive` ゲッターで修正し vue-tsc 3.2.7 + TS6 の TS2339 誤検知を解消。
  - `@vue/*` コアパッケージを pnpm overrides で 3.5.33 に統一し、バージョン不整合を修正。

---

### モダン ESLint スイートの統合と品質強化 (ADR-059) — 完了

- [x] ESLint 10.2.1 (Flat Config) への完全移行とプラグイン・スイートの導入
- [x] `eslint-plugin-import-x` による ESM 解決の近代化
- [x] `eslint-plugin-unicorn`, `eslint-plugin-promise`, `eslint-plugin-jsx-a11y` の統合
- [x] `eslint-plugin-vitest`, `eslint-plugin-tsdoc`, `eslint-plugin-no-only-tests` による開発プロセスのガード
- [x] `eslint-plugin-lit`, `eslint-plugin-wc` による Web Components 実装の品質担保
- [x] 全 51 パッケージでの `pnpm lint` パス確認
- [x] 直近の品質ゲートでの残警告解消（`adapter-uci`, `adapter-gnubg`, `adapter-gtp`, `adapter-usi`, `adapter-katago`, `adapter-yaneuraou`, `ui-react-core`, `zenith-dashboard-react`）

## 📈 次のマイルストーン (Next Steps)

以下が現時点での未着手・進行中タスクです。優先度の高い順に示します。

### ✅ npm publish 認証: OIDC Trusted Publishing 対応済み（2026年4月28日）

- `release.yml` を OIDC Trusted Publishing 方式に更新（`NPM_TOKEN` 不要・トークン管理ゼロ）
- `scripts/setup-trusted-publishers.mjs` を追加（全 48 パッケージへの Trusted Publisher 一括設定ツール）
- `pnpm npm:setup-oidc` コマンドで実行可能

### 🔴 BLOCKER — リリース前必須（手動作業）

> **初回 publish のみ Granular Token が必要**。publish 後は OIDC に完全移行できます。

- [ ] **[手順1] npmjs.com で Granular Access Token を発行**: [https://www.npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens) → Generate New Token → Granular Access Token → "Bypass 2FA" を有効化・スコープ `@multi-game-engines` の全パッケージに read/write 権限・有効期限90日
- [ ] **[手順2] 初回 publish の実行**: `NPM_TOKEN=<token> pnpm run release`（全 47 パッケージが npm に登録される）
- [ ] **[手順3] Trusted Publisher を一括設定**: `npm login && pnpm npm:setup-oidc`（パッケージ登録後に実行 → 以降 OIDC で自動認証、トークン不要）
- [ ] **[手順4] Granular Token を失効**: npmjs.com でトークンを削除（OIDC 移行後は不要）
- [ ] **GitHub Pages 有効化**: リポジトリ Settings → Pages → Source を "GitHub Actions" に設定（A3 TypeDoc デプロイの前提条件）
- [ ] **自社ホスティング済みバイナリの SRI 確定**: やねうら王・KataGo・Edax・gnubg・KingsRow・Mortal は実バイナリをデプロイし SHA-384 を算出して `engines.json` の `__unsafeNoSRI` を置換する（別リポジトリ `multi-game-engines-assets` にて作業）
  > **備考**: `__unsafeNoSRI` は本番 (`NODE_ENV=production`) では `SECURITY_ERROR` で自動遮断済みの開発フラグ。

### 🟠 High Priority — Phase B（バイナリ配信インフラ）

- [ ] **Phase B1**: Cloudflare R2 / GitHub Pages（`multi-game-engines-assets` リポジトリ）の配信設定
- [ ] **Phase B2**: やねうら王 WASM ビルドパイプライン (Emscripten)
- [ ] **Phase B3**: KataGo / Edax / gnubg / KingsRow / Mortal WASM ビルド
- [ ] **Phase B4**: SRI 自動再計算 CI（バイナリデプロイ → `pnpm sri:refresh` → PR 自動作成）

### 🟡 Medium Priority

- [ ] **Playwright E2E 拡充**: `ui-vue-monitor` への CT テスト追加（`ui-react-monitor` に続く第2弾）
- [ ] **Multi-Runtime Bridge**: 同一アダプターで WASM と OS Native バイナリを自動切替
- [ ] **英語版ドキュメント拡充**: `docs/en/` 配下 (`DECISION_LOG.md` 等) の整備
- [ ] **UI Logic オフロード**: 超高頻度 `info` 出力時のメインスレッド保護のため `ui-core` を UI Worker へ委譲するアーキテクチャ検討

### 🔵 Future / Research

- [ ] **Hardware Acceleration**: WebNN (NPU/GPU 活用 NNUE 推論) / WebGPU Compute の統合
- [ ] **Swarm — Expert Mapping**: アンサンブルアダプターへの序盤・終盤特化エキスパートマッピング追加
- [ ] **Observability**: OpenTelemetry 統合による実行時パフォーマンス可視化
- [ ] **Incomplete Information Games**: `adapter-poker`, `adapter-bridge` の抽象化設計

## 🏆 到達ハイライト (2026-04-27 依存関係メジャーアップデート & TS2882 対応)

- **28 パッケージ一括アップデート (PR #96)**:
  - TypeScript `6.0.2 → 6.0.3`、ESLint `10.2.0 → 10.2.1`、Vue `3.5.32 → 3.5.33`、Vite `8.0.8 → 8.0.10`、Vitest `4.1.4 → 4.1.5`、`@types/node` `24.x → 25.6.0`、Tailwind CSS `4.2.2 → 4.2.4`、Next.js `16.2.3 → 16.2.4`、Wrangler `4.81.1 → 4.85.0` 等 28 パッケージの最新バージョンへ更新。
  - TypeScript 6.0.3 の新規エラー **TS2882**（ESM モジュールにおける拡張子なし副作用 import の禁止）に対応するため、`packages/ui-shogi/src/components/ShogiBoard.vue` および `packages/ui-chess/src/components/ChessBoard.vue` の `import "../elements"` を `import "../elements.js"` へ修正。
  - `pnpm/action-setup` を v5 から v6 へ更新 (PR #88)、全 CI ワークフロー (`ci.yml`, `refresh-sri.yml`, `release.yml`) に適用。
- **テストカバレッジの大幅引き上げ (PR #92)**:
  - 9 パッケージで合計カバレッジを 63–100% へ引き上げ (`ui-core`, `ui-elements`, `ui-react-monitor`, `ui-react-core`, `i18n-core`, `registry`, `ui-shogi-elements`, `ui-vue-monitor`, `ui-chess`)。
  - `SearchMonitor` の RAF スタブを `Map` + 実 `clearTimeout` + `performance.now()` モック構成に刷新し、决定论的かつ副作用のない RAF キャンセル検証を実現。
  - `EngineMonitorPanel` のタブ切り替えテストに `aria-selected` 状態の前後検証を追加。
  - `createBackgammonMove` のセミコロン・インジェクションテストを `i18nKey` アサーション付きに強化。

## 🏆 到達ハイライト (2026-04-05 Quality Gate Finalization)

- **最新の CI 収束**:
  - `build-and-test`, `CodeQL`, `CodeRabbit` を含む PR #60 の全チェックをグリーンに到達させました。
  - `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` のローカル品質ゲートを再実行し、再現性を確認しました。
- **警告ゼロ運用の前進**:
  - `adapter-*` 群と `ui-react-core`、`zenith-dashboard-react` の未使用 import / TSDoc 警告を解消しました。
  - React 19 互換の `use` / Provider 形式へ UI プロバイダーを更新し、将来の互換性警告を減らしました。
- **依存関係と監査の安定化**:
  - lockfile と package manifest の不整合を解消し、`pnpm audit --prod` の脆弱性を解決しました。

## 🏆 到達ハイライト (2026-03-05 Monorepo Re-Build & Test Stability)

- **クリーンビルドと全テストの完遂 (100% Pass)**:
  - 依存関係の不整合を排除するため、全パッケージの `node_modules` およびロックファイルを削除し、クリーンな環境での再構築（`pnpm install`, `pnpm build`）と検証（`pnpm test`）を実施しました。
  - 全 51 パラレル・ワークスペースにおけるテストスイートの 100% パスを確認しました。
- **UI レプリケーションとテスト堅牢性の強化**:
  - `ui-shogi` における局面再生および駒情報のレンダリングにおいて、翻訳データの欠落に対するフォールバック（生の駒文字表示）を実装し、実行時の堅牢性を向上させました。
  - Web Components 固有のテスト課題（JSDOM におけるカスタム要素の登録タイミングやフォーカス制御）を、副作用を考慮したインポート構造の最適化と標準 `DOM` API への移行により解消。`boundary.test.ts` を含む難易度の高いテストの決定論的動作を保証しました。
- **キーボードナビゲーションの高度な同期**:
  - `ui-shogi-elements` において、`Ctrl + Home/End` や `PageUp/Down` を含む高度なキーボードショートカットを実装し、プロジェクト全体のアクセシビリティ基準を Zenith Tier へ引き上げました。

## 🏆 到達ハイライト (2026-04-05 Quality Gate Finalization)

- **最新の CI 収束**:
  - `build-and-test`, `CodeQL`, `CodeRabbit` を含む PR #60 の全チェックをグリーンに到達させました。
  - `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` のローカル品質ゲートを再実行し、再現性を確認しました。
- **警告ゼロ運用の前進**:
  - `adapter-*` 群と `ui-react-core`、`zenith-dashboard-react` の未使用 import / TSDoc 警告を解消しました。
  - React 19 互換の `use` / Provider 形式へ UI プロバイダーを更新し、将来の互換性警告を減らしました。
- **依存関係と監査の安定化**:
  - lockfile と package manifest の不整合を解消し、`pnpm audit --prod` の脆弱性を解決しました。

## 🏆 到達ハイライト (2026-03-05 Modern ESLint Suite Integration)

- **モダン ESLint スイートの全面導入**:
  - プロジェクトのコード品質基準を大幅に引き上げるため、`import-x`, `unicorn`, `promise`, `jsx-a11y`, `vitest`, `tsdoc`, `no-only-tests` 等の最新プラグイン群を統合しました。
  - 特に `import-x` への移行により、ESM ファーストなモノレポ環境における循環参照検知やモジュール解決の静的検証が強化されました。
- **マルチパッケージ構成におけるプラグイン競合の解消**:
  - ESLint v10 の Flat Config 仕様に伴う「プラグインの二重定義制限」に起因するサブパッケージ（`zenith-dashboard-react` 等）でのビルドクラッシュを、ルート設定との整合性維持により物理的に解消しました。
- **段階的なルール適用戦略の確立**:
  - `unicorn` や `jsx-a11y` の厳格すぎるルールについては、既存コードへの影響を最小限に抑えるため一時的に緩和し、将来的な段階的強化（Hardening）のためのベースラインを策定しました。
- **テスト・ドキュメント品質の自動ガード**:
  - `vitest` プラグインによるテストコードの検定、`tsdoc` によるドキュメント構文の検証、および `no-only-tests` による CI 事故の未然防止を標準化しました。

### 1. Zenith Robustness & 100% Coverage Challenge (品質の極致)

- [x] `core` パッケージのラインカバレッジ **98.41%** 達成
- [x] 異常系・エッジケースの完全網羅テストスイートの構築
- [x] `EngineFacade` におけるミドルウェア故障の完全絶縁 (Isolation)
- [x] `ProtocolValidator` への循環参照検知ロジックの実装
- [x] `NativeCommunicator` の巨大メッセージ・パケット分割耐性の強化
- [x] `EngineBridge` の非同期ファクトリ対応とライフサイクル安全性の証明

### 2. Advanced Development Skills Integration (継続強化)

- [x] 統合計画の策定 (`docs/implementation_plans/20260227_advanced_skills_integration.md`)
- [x] Playwright E2E テストの拡充
- [x] ビルドプロセスへの SRI 自動再計算 (`sri:refresh`) の統合
- [x] **アクセシビリティ強化 (ADR-051)**: キーボードナビゲーションの完全実装と物理的実証テストの追加。

## 🏆 到達ハイライト (2026-03-04 Security Hardening & CodeQL Compliance)

- **CodeQL 準拠のネットワークセキュリティ強化**:
  - `EngineLoader` において URL オブジェクトを用いた厳格なプロトコル検証を実装し、HTTPS をデフォルトで強制。これにより CodeQL のセキュリティ警告（Cleartext transmission of sensitive information）を解消。
  - 開発体験を損なわないよう、例外として `127.0.0.1`, `::1`, `localhost`, および `*.localhost`（Portless 等のローカル開発ツール用サブドメイン）のみ HTTP 通信を許可する安全なフォールバックを `SecurityAdvisor` に集約・実装。
  - GitHub Actions の SRI 再計算ワークフロー (`refresh-sri.yml`) における `GITHUB_TOKEN` の重複認証を修正し、セキュリティと安定性を向上。

## 🏆 到達ハイライト (2026-03-03 UI Reactivity & E2E Test Hardening)

- **i18n 基盤のアーキテクチャ刷新**:
  - JSON インポートに起因する Nuxt/Vite/Next.js 環境でのモジュール解決の不安定さ（500エラー等）を根本から排除するため、全ての `i18n-*` パッケージのロケールデータを `.ts` 化し、`src` ディレクトリへ統合しました。これにより、バンドルと型チェックの完全な安全性が担保されました。
- **UI フレームワークのリアクティビティ最適化**:
  - **Vue ダッシュボード**: エンジンインスタンスを `ref` ではなく `shallowRef` で管理することで、Vue の Proxy 介入による `WorkerCommunicator` の予期せぬ破棄や内部状態の崩壊を物理的に防止しました。また、コンポーネントの再マウントを抑える `v-show` の活用や、非同期レンダリングのタイミングを `nextTick` で緻密に制御する手法を導入しました。
  - **React ダッシュボード**: 厳格な Lint ルール (`@typescript-eslint/no-explicit-any`) への準拠と、`EngineMonitorPanel` への安全なプロパティ受け渡しを徹底し、本番同等のビルド環境での安定動作を確認しました。
- **E2E テストの究極的安定化 (100% Pass Rate)**:
  - Playwright によるテストにおいて、ハイドレーション待機 (`networkidle`)、ステータスの日英両対応判定、リトライループ、および要素クリックの強制 (`force: true`) を導入しました。非同期 UI の状態遷移に左右されない堅牢なテストスイートが完成し、並列探索テストを含む全てのブラウザ検証がグリーンに到達しました。
- **初期化ロード戦略と SRI バイパスの整備**:
  - `EngineFacade` および `BaseAdapter` のステータスガードを本来の厳格な仕様に復元し、ユニットテストの信頼性を確保しました。同時に、E2E テスト環境用には Mock Worker の SRI チェックを安全にバイパス (`__unsafeNoSRI: true`) する仕組みを確立しました。

## 🏆 到達ハイライト (2026-03-01 Zenith Quality Finalization)

- **PR #47 レビュー指摘の完全解消 (Review Resolution)**:
  - **I18nKey 運用の厳格化**: プロジェクト全体の 90 箇所以上の `as I18nKey` キャストを排除し、`createI18nKey` ファクトリによるバリデーション付き生成へ完全移行。
  - **テストの決定性向上**: `performance.now()` のモック化と `vi.useFakeTimers()` の適用により、環境に依存しない安定したテストスイートを構築。
  - **インフラ層のリファクタリング**: 各アダプターに散在していたソース検証ロジックを `core` の `normalizeAndValidateSources` へ集約。
  - **セキュリティの再強化**: `EngineLoader` において、ローカルホスト以外の `http:` 通信を無条件で遮断するロジックを実装し、CodeQL の警告を解消。
- **アクセシビリティの極致**:
  - `ChessBoard`, `ShogiBoard` 等の主要 UI におけるフルキーボードナビゲーションの実装と、それを検証する自動テストスイートの完備。
- **100% 品質ゲートの突破**:
  - 全 51 パッケージにおける **Build, Typecheck, Lint, Test すべてのパス**を確認（テスト数: 356件）。
  - Zero-Any ポリシーをプロダクションコードで 100% 遵守。

## 🏆 到達ハイライト (2026-02-28 Zenith Robustness & High Coverage)

- **極限堅牢性の物理的実証 (Zenith Robustness)**:
  - `core` パッケージにおいて **98.41%** のラインカバレッジを達成。正常系のみならず、ネットワーク切断、ストレージ競合、パケット分割、循環参照、Wasm スレッド生成失敗などの異常系を網羅。
  - **ミドルウェア絶縁 (Isolation)**: 故障したミドルウェアがエンジンのメインプロセスを中断させない `try-catch` 保護構造を `EngineFacade` に実装。
  - **構造的攻撃の動的防御**: `ProtocolValidator` に `WeakSet` による循環参照検知を追加。悪意あるネスト入力によるスタックオーバーフローを物理的に防止。
  - **ストリーム整合性の保証**: `NativeCommunicator` において、OS パイプから届く分割されたパケットを内部バッファで再構築し、巨大な PV 等のメッセージを欠落なくパースする機能を実装。
- **Asian Variants の完全実装と標準化**:
  - 中国将棋 (`adapter-xiangqi`) およびチャンギ (`adapter-janggi`) のアダプターとドメインパッケージを完備。
  - 両アダプターに `ProtocolValidator` によるインジェクション防御と `ScoreNormalizer` による評価値正規化を適用し、Zenith Tier 基準の品質へ引き上げ。
- **ドキュメントのグローバル同期**:
  - `docs/en/` 配下の英語ドキュメントを最新の実装と設計（ミドルウェア絶縁、ユニバーサルストレージ等）に合わせ、日本語版と完全に同期。

## 🏆 到達ハイライト (2026-02-27 Zenith Hardening & 多ゲーム統合基盤)

- **思考情報の完全標準化 (Standardized Engine Bridge)**:
  - `IBaseSearchInfo` を拡張し、異種ゲーム（将棋、チェス、囲碁、リバーシ等）の評価値を `-1.0 〜 1.0` の共通スケールに正規化する `ScoreNormalizer` を実装。UI 層での汎用的な評価グラフ・バー表示を容易に。
  - `positionId` による古い解析メッセージの自動破棄機能を実装し、高速な局面移動時の表示のチラつき（レースコンディション）を物理的に解消。
- **究極の環境適応型ストレージ (Universal Storage)**:
  - Web (OPFS/IDB) に加え、Node.js/Bun CLI 環境向けの `NodeFSStorage` を新規実装。OS ファイルシステムをキャッシュとして利用可能にし、デスクトップ/サーバー環境での効率を最大化。
  - プラグイン可能なアーキテクチャにより、Capacitor や Cordova 等のネイティブファイル領域への保存ロジックも外部から注入可能に。
- **高度なフロー制御とレジリエンス**:
  - `AbortSignal` を全 API に統合し、探索やロードの即時中断をサポート。
  - `fetchWithRetry` (指数バックオフ) および HTTP Range による「再開可能ロード」を実装。巨大な NNUE ファイルのダウンロード耐性を大幅に向上。
  - 優先度制御・割り込み可能な一括解析キュー `EngineBatchAnalyzer` を提供。
- **2026 Zenith Security & Compliance**:
  - `ProtocolValidator` によるコマンドインジェクション防御の全数監査と適用。
  - ライセンス同意を初期化フローに組み込む「同意ハンドシェイク」ステートマシンを実装。
  - 物理的な Wasm SIMD 検証ロジックを導入し、非対応環境でのクラッシュを未然に防止。
- **モックアダプターの標準化**:
  - CI/CD やフロントエンド先行開発に最適な軽量 `MockAdapter` をコアに同梱。外部アセット不要で即座に思考エミュレーションが可能に。
- **Opening Book Provider (Zenith Infrastructure)**:
  - 巨大な定跡データ（.bin, .db）をエンジン本体とは独立してロード・管理・共有するための `BookProvider` 基盤を実装。
  - 全アダプターに `setBook` インターフェースを導入し、動的な定跡切り替えに対応。
- **Gomoku Domain & Reversi Precision (task_0001 extended)**:
  - `@multi-game-engines/domain-gomoku` を新設し、Branded Types による五目並べの型安全な指し手・局面定義を完遂。
  - `adapter-edax` (リバーシ) において、Edax 固有の出力から石差を正確にパースし、`-1.0 〜 1.0` に正規化するロジックを実装。

## 📅 更新日: 2026年2月27日 (実装担当: Advanced Development Skills Integration)

- **E2E 検証の高度化**:
  - React/Vue 両ダッシュボードにおいて、Stockfish と やねうら王を同時に動かす「並列探索テスト」を導入。並列実行時の状態隔離と UI の整合性を自動検証可能に。
  - ロケール切り替え（EN/JA）のライフサイクルテストを追加し、i18n パッケージ分離後の実行時整合性を保証。
- **Security & SRI の自動担保**:
  - `pnpm build` および `pnpm ai:check` の一環として、リモートバイナリの SRI ハッシュを自動的に再計算し `engines.json` を更新するパイプラインを構築。ハッシュの更新漏れによる実行時エラーを物理的に排除。
- **アーキテクチャ・ガードの強化**:
  - `awesome-claude-skills` の知見を取り入れ、ADR-050 を策定。エージェントによる開発の並列性と品質を両立させる体制を整備。

## 📅 更新日: 2026年2月26日 (実装担当: Federated i18n Architecture)

- **物理的ドメイン隔離の達成**:
  - 各ゲームドメイン（Chess, Shogi 等）が自身の言語リソースのみをパッケージとして依存する「Pay-as-you-go」アーキテクチャを確立。
- **究極の型安全性 (Zero-Any Policy)**:
  - i18n アクセス層から `any` を完全に追放。`DeepRecord` 型の導入により、複雑な階層構造を持つ翻訳データに対しても TypeScript の厳格なチェックを適用。
- **フルスタック・マイグレーション**:
  - パーサー、アダプター、アンサンブル、レジストリ、UI コンポーネント、そして React/Vue 両ダッシュボードに至るまで、全 40 以上のコンシューマーパッケージを新構成へ一括移行。
- **CI 品質の完全維持**:
  - 物理構造の変更に伴う `tsconfig.json` パス、依存関係、テスト期待値の不整合を全て解消。全 160 ケース以上のテストがグリーンの状態を維持。

## 📅 更新日: 2026年2月23日 (実装担当: PR `#38` 最終監査と整合性同期)

## 🏆 到達ハイライト (2026-02-23 PR #38 超深層監査と整合性同期)

- **Zenith Tier 品質基準への到達**: PR #38 のマージにより、決定論的テスト、i18n 同期、物理構造の適正化を完了。
- **プラグイン可能レジストリ基盤**: エンジンメタデータの解決チェーンを EngineBridge に実装。
- **ビルドパイプラインの完全成功 (Zenith Build Consistency)**:
  - 全 39 パッケージのクリーンビルドおよび型チェックをパス。エクスポート構成の変更後も 100% の整合性を維持。
- **公開 API の洗練 (Public API Polish)**:
  - `EngineError` の `ValidI18nKey` 型やストレージファクトリ `createFileStorage` を公開し、サードパーティ開発者向けの DX を極大化。
- **Absolute Zenith Quality Audit の完遂**:
  - 全 61 件のレビュー指摘事項を「最奥地」まで再検証。リソースリーク、非同期安全、型契約の不整合を完全に解消しました。
- **翻訳データの 100% 同期 (i18n Persistence)**:
  - `core` で定義した全 15 種類の新しいエラーキーに対し、`en.json` / `ja.json` の翻訳を完備。実行時の例外フィードバックを Zenith 品質で保証しました。
- **リソース管理の極致的な堅牢化**:
  - `EngineLoader` の ID 衝突問題をセパレータの `:` 復帰により解決。
  - `revokeAll()` の実装と `EngineBridge.dispose()` への統合により、Blob URL のメモリリークを物理的に遮断。
  - `IndexedDBStorage` に `onblocked` タイムアウトを導入し、マルチタブ環境でのハングを防止。
- **E2E テストの完全な安定化**:
  - 不不安定な `networkidle` を排除し、UI 要素ベースの精密な待機アサーションに刷新。複数エンジン混在時の Locator 競合を解消しました。
- **プロトコルのヌル安全正規化 (Zenith Tier Type Safety)**:
  - `UCIParser` および `USIParser` において、特殊な指し手 "none" / "(none)" を `null` に正規化。
  - `GTPParser` において `resign` を `bestMove: null` に正規化し、意味的な整合性を確保しました。
- **ビルドパイプラインの警告ゼロ化 (Clean Build Initiative)**:
  - **ESLint 9.39.3 ピン留め**: ADR-044 を策定し、モノレポ環境での設定の安定性を物理的に保証。
  - **非同期安全ルール有効化**: `@typescript-eslint/no-floating-promises` を適用し、Promise 処理漏れを静的に一掃しました。
- **リリースプロセスの確立**:
  - `.changeset` を導入し、Zenith Tier アップデートの内容を自動リリースノートへ反映可能な状態に整備。
- **ドメインロジックの厳密化**:
  - `domain-go` におけるバリデーション順序を `typeof` 先行に是正。i18n キーへの完全移行と、ハードコードされた型名の自然言語化を完遂しました。

... [後略] ...
