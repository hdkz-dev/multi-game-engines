# プロジェクト・ロードマップ (2026-2027)

## 開発用Node LTSの更新 (2026-10-25)

`.node-version` と `.nvmrc` を24.13.0から、24系LTSのセキュリティリリース24.22.1へ更新する。[公式リリース一覧](https://nodejs.org/dist/index.json)と配布物のSHA-256を照合し、実際のNode 24.22.1で品質ゲートを検証する。CIのNode指定は引き続き24系。公開API・公開パッケージの対応範囲は変更しない。OSV監査の上流待ちは別の未完了条件として維持する。

## OSV監査の上流修正待ち (2026-10-25)

保守PR [#286](https://github.com/hdkz-dev/multi-game-engines/pull/286) の実装コミット `2ea32d5` は、CIのbuild・lint・typecheck・test・core coverage・文書同期、E2E全4系統、ESLint・CodeQL・ベンチマークを通過した。pnpm audit（全依存・本番依存）は0件。一方、OSV監査はGHSA-vjh5-4x84-xrqpのNuxt 3向け範囲に上限がないため、修正済みのnuxt / @nuxt/nitro-server 4.6.2を誤検出して失敗している。監査全体の成功とは扱わない。

既存の上流修正PR [github/advisory-database#10504](https://github.com/github/advisory-database/pull/10504) を独立検証し、公開済み安定版Nuxt 277版・@nuxt/nitro-server 32版で公式の影響範囲との一致を確認した。[下流CIの再現情報を追記済み](https://github.com/github/advisory-database/pull/10504#issuecomment-6385792027)。現時点では上流未統合・OSV未反映。反映を確認してからCIを再実行する。監査除外・強制統合は行っていない。

## 開発依存とツールの更新 (2026-10-24)

main `2d9ffbc`を基点に43種類の直接依存とpnpm 12.15.0・OSV Scanner 2.7.0を更新。Next 16.4.3・Storybook 10.6.3・Nuxt 4.6.2・tsup 9.0.0を採用し、pnpm auditは全深刻度0件。pnpm設定をpnpm-workspace.yamlへ移し、strict peer検査・同一のビルド許可対象・公開後24時間の保護を維持する。公開直後の版には例外を設けない。TypeScript 7は周辺ツールのpeer範囲外、Unicorn 78はcoreだけで644件の新規則指摘があり、公開API・非同期処理に及ぶ移行として分離する。#280の公開とM1b/M1cは未完了。

[保守更新記録](implementation_plans/20261024-toolchain-refresh.md) / [ADR 065](adr/065-pnpm12-and-toolchain-refresh.md)

## 最新確認と次の保守更新 (2026-10-15)

main `56d8932`とリモートmainは一致。PR #274の17種類の更新とPR #275の4パッケージ公開は完了し、npmの対象版・integrityを再確認した。mainの未解決CodeQL・Dependabot警告は0件。新規PRは#276（Unicorn、CI失敗）、#277（通常依存更新）、#278（Happy DOM 21、元CI成功）。#277にHappy DOM 21とZod 4.6.7をまとめ、6種類を検証する。#278は#277統合確認後に重複整理する。TypeScript 7・Unicorn 78・tsup 9の移行と他の最新候補は別途評価する。M1b/M1cは未完了。

[2026-10-15 maintenance record](implementation_plans/20261015-status-and-dependency-maintenance.md)

## 2026-10-11依存最新化

2026-10-11、最新main `8f91525`を基点に使用中の直接依存を再調査し、17種類を最新互換版へ更新。Next 16.4.0のglob修正パッチを移植し、Node型26.6.5はNode 24で検証する。TypeScript 7はtypescript-eslint/TypeDocのpeer範囲外、Unicorn 77は試行で公開boolean名・クラス構造に波及する新規則を確認したため別移行として残す。新たな固定・ignore・規則抑制は追加しない。詳細は [依存最新化記録](implementation_plans/20261011-dependency-refresh.md) を参照。PR #273の監視UI2件はnpm公開・integrity照合まで完了済み。M1b/M1cは別の残課題。

## 2026-10-09再開時の状況

PR #269でM1a（通信境界）とQ1（公開APIテストの型安全化）は統合済み。mainのCodeQL警告・Dependabot警告は0件。PR #270は2026-10-09に統合済み（7391dbb）、core 0.2.2を含む45パッケージのnpm公開を全件確認。公開後CI・E2E・文書公開・SRI更新・Releaseもすべて成功。PR #272はUnicorn 77の設定互換性で失敗したため、ADR 061に従いUnicorn 64・Node 25型を維持し、minor/patch更新を検証する。Node型の解決版は25.9.9へ更新。メジャー更新はDependabotの通常グループから分離して個別に審査し、無視設定は追加しない。M1b（SRI必須化とキャッシュ完全性）・M1c（応答サイズ契約）は残件。

## 通信境界の修正 (2026-10-07)

main `2b6b534`でPR #268の依存修正は統合済み。監査0件、統合後CI・E2E・Release・文書公開・SRI更新は成功。今回M1aの通信境界を修正（統合待ち）：キャッシュ前にURLを検証し、HEAD・Range・GETはsafeFetch、credentials omit、redirect errorを使う。URL内資格情報・不正URL・外部HTTPをSECURITY_ERRORで拒否する。HEADのセキュリティ拒否・中断はfallbackしない。CodeQL 68–70の閉鎖は統合後に確認する。M1bのSRI必須化、M1cの応答サイズ契約、Q1は公開API経由のテストへ移行し、anyと抑制を除去済み（統合待ち）。Dependabot PR #267のaction-download-artifact v27更新も本変更に含める。

最新課題の根拠・影響・未検証事項は [課題台帳](ISSUES.md) を参照（2026-10-06更新）。

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
- [ ] **Hardware Acceleration (Zenith Standard)**:
  - **WebNN**: NPU/GPU を活用した NNUE 高速推論の統合 (W3C 2026 CR 準拠)。
  - **WebGPU Compute**: 並列探索アルゴリズムの GPU へのオフロード。
- [x] **Swarm (Ensemble) Architecture**:
  - **アンサンブル・アダプター**: 複数エンジンによる合議システムの実装。
  - [ ] **エキスパート・マッピング**: 固定重み付き戦略は実装・テスト済み。序盤・終盤等に応じた動的マッピングは未確認のため残件として管理する。
- [ ] **Mobile & Hybrid Bridge (Native Power)**:
  - **Hybrid Bridge**: 環境（Browser/Node/Desktop）応じた WASM/Native バイナリの透過的切替。
  - **Mobile Native Bridge**: Capacitor/Cordova プラグインによる、モバイル OS ネイティブ環境での最高性能エンジン実行。
- [x] **Modular Split**: UI パッケージの物理分離（core/monitor/game）による「Pay-as-you-go」アーキテクチャの完成。
- [x] **Federated i18n Architecture**: 多言語リソースの物理パッケージ分離と、Zero-Any 型安全性の完遂。
- [x] **Standardized Core (task_0001)**: 異種ゲームの評価値正規化、`positionId` による競合制御、および読み筋の構造化。
- [x] **Universal Storage & Flow Control**: Node.js/Bun CLI 環境への対応、`AbortSignal` 標準化、およびレジューム機能付きロード。
- [x] **Binary Variant Selection**: SIMD/Threads に応じた最適な WASM バイナリの自動ディスパッチ。
- [ ] **Custom Distribution**: 自前 CDN (Cloudflare R2/Workers) によるバイナリ供給。
- [x] **Release Automation**: Changesets 自動化 + `release.yml` 整備（npm publish パイプライン構築済み。`NPM_TOKEN` 登録で本番稼働）。
- [x] **Quality Gate Stabilization**: PR #60時点で検証ワークフローを整備。最新mainのCIは成功しているが、CodeQL High警告3件は未解決。CLI CodeRabbitレビューとGitHub botのレビュー実施有無は区別する。
- [x] **Observability**: OpenTelemetry (OTel) 統合による実行時パフォーマンスの可視化。
- [x] **Release Readiness (2026-02-19 レビュー指摘)**: npm 公開に向けたメタデータ整備。✅ **2026-05-08 npm publish 完了 (46パッケージ)**
  - [x] ルート LICENSE ファイル作成、全パッケージの `license` フィールド追加。
  - [x] **[BLOCKER-A]** Stockfish 全バリアント SRI 算出完了（`pnpm sri:refresh` で実 SHA-384 を `engines.json` へ反映済み）。
  - [ ] **[BLOCKER-B] 本番AIモデルへの置換** — 2026-10-06確認: KataGo/MortalはGitHub PagesでHTTP 200、SRI登録済み。KataGoのスタブONNX生成・MortalのスタブWorker配信ジョブは存在する。KataGoの実モデルURL (`KATAGO_ONNX_URL`) は未登録、Mortalの実モデル変換・推論実装は未完了。配信済みスタブと本番モデルを区別する（ADR-014）。
  - [x] 20パッケージへの README.md 追加。
  - [x] CI (`release.yml`) の Node.js バージョン不整合の修正。
  - [x] **npm publish 達成** — core@0.2.0, adapter-bridge/poker/uci/usi/gtp@1.0.0, ui-react/vue-monitor@0.2.0 ほか 46パッケージ (2026-05-08)
- [x] **Extended Adapters**:
  - **Board Games**: バックギャモン (gnubg), チェッカー (KingsRow), リバーシ (Edax)。
  - **Asian Variants**: 中国将棋 (Xiangqi), チャンギ (Janggi)。
  - **Incomplete Information**: ポーカー (DeepStack), ブリッジ, 花札。
- [x] **Multi-Engine Ensemble**: 同一局面を複数エンジンで同時解析する UI/Logic の提供。

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
- [x] **Extreme Robustness**: ラインカバレッジ目標 ≥98.4% (PR #49 時点 98.41% 達成 → 2026-05-09 計測で 84.6% に低下 → PR #140〜#161 で **98.45% (2026-05-11)** まで復元 ✅ **目標達成**)。Coverage Restoration バックログは完全クローズ。CI は `lines ≥98.4 / branches ≥88` でしきい値固定 (PR #161)。ミドルウェア絶縁、循環参照保護、パケット分割耐性は実装済み。
- [x] **Continuous Benchmarking**: `vitest bench` によるコアホットパス継続計測 + `.github/workflows/bench.yml` で PR 単位の性能回帰検知。
- [x] **Self-Healing Docs**: `TypeDoc` 0 warnings 達成 + `docs.yml` による GitHub Pages 自動デプロイ。
- [x] **Browser Matrix Verification**: `Playwright` による、実ブラウザ上での WASM 動作保証。
- [x] **Contract-driven Safety**: `Zod` による、Worker 通信境界でのランタイム検証。
- [x] **Zero-Any Policy**: プロダクションコードにおける any 型の完全排除。
- [x] **Merge Policy (NO SQUASH)**: ブランチ内の修正遍歴を `main` から辿れるよう、squash merge を **メモリ / ポリシー文書 / GitHub repo 設定の三層で禁止** (PR #163)。`allow_squash_merge: false` で物理的に不可能化、`gh pr merge --merge` が唯一の正式手段。

---

## 🔮 未来のビジョン

- **WebNN Acceleration**: ハードウェアアクセラレーションによる次世代 NNUE エンジン。
- **P2P Engine Sharing**: 分散コンピューティングによる定跡生成ネットワーク。
- **Multi-Agent Analysis**: 複数エンジンによる同時解析とアンサンブル推論。

## 依存更新と検証 (2026-09-17)

依存更新では npm の安定版を基準に、公開 API とツールの正式な互換範囲を検証します。直接依存には互換更新を許す範囲を指定し、間接依存の override は監査で必要な安全下限と、根拠のある互換性修正に限定します。

ESLint と Oxlint のアクセシビリティ検査を組み合わせ、lint の警告も品質ゲートを失敗させます。TypeScript の宣言ファイル検査は有効にし、非推奨オプションの抑制でビルドを通しません。移行と例外の根拠は [ADR 061](adr/061-dependency-refresh-and-strict-validation.md) を参照してください。

2026-09-18: Nitro の ZIP 出力を Archiver 8 に対応させ、非推奨の間接依存を除去しました。React/Vue の E2E はブラウザー警告・未処理例外も検査し、初期盤面、Vue の任意 props、探索停止と実エラーの UI 処理を修正しています。詳細と検証結果は ADR 061 に記録します。

2026-09-27: 統合前レビューで、エンジン切り替えと新しい操作の開始後に古い失敗結果が UI を上書きしないよう補強しました。追加の依存更新と検証結果は ADR 061 に記録しています。

依存更新の2026-10-04時点の制約と Dependabot 失敗の原因は [ADR 061](./adr/061-dependency-refresh-and-strict-validation.md) を参照。

開発ツールの暗号・glob 依存を安全な実装に移行する。構成図、対象バージョン、回帰検証は [ADR 062](./adr/062-development-tooling-security-backends.md) を参照。

2026-10-06: 新規の5件の脆弱性を修正するため simple-git >=4.0.1 <5、@simple-git/argv-parser >=2.0.1 <3、source-map-js >=1.2.2 <2 を脆弱な範囲に限定して適用する。Nuxt DevTools 3.4.2 のGitファクトリ参照を名前付きエクスポートへ更新し、branch/revparse/status の互換性を検証する。上流が安全な依存範囲へ移行した時点で override とパッチを除去する。

## 現在の残作業と実行順序 (2026-10-06)

CodeQL High 3件の通信境界修正、通常依存15種類の更新、公開準備・状況文書の整合を優先する。TypeScript 7・Unicorn 77・Node型定義26は個別移行として扱う。上流対応後のパッチ撤去と将来機能の前提・完了条件は [実行計画](implementation_plans/20261006-maintenance-and-roadmap.md) を参照。CI成功はコード解析警告0件や本番モデル完成を意味しない。

2026-10-06詳細整理: 通信・SRI・応答契約調査をM1a/M1b/M1cに分割し、Q1（テストany）とF5（動的Expert Mapping）を管理する。18種類の依存版一覧、15パッチ/10 overridesの撤去条件、検証マトリクスは [課題台帳](ISSUES.md) を参照。担当・期限は未割当、実装修正は未完了。

## 2026-10-07の更新

最新mainは `3febeb0`。新規監査のshell-quote Critical（S1）・sharp High（S2）を最優先とし、CodeQL High 3件は別に管理する。依存更新候補は18種類（通常15、メジャー3）。S1/S2はshell-quote 1.11.0・sharp 0.35.5へ修正済み（統合待ち）。Next経由とWrangler→Miniflare経由のsharpを、脆弱範囲限定の `sharp@<0.35.5: >=0.35.5 <0.36` で解決した。修正ブランチのpnpm auditは0件、lint・typecheck・build・test、Changesets status、sharpのSVG→PNG変換、Wrangler起動確認は成功。CodeQL High 3件とその他の課題は未解消。根拠・経路・安全下限・検証条件は [課題台帳](ISSUES.md) を参照。10月6日の監査0件は履歴として扱う。
