# プロジェクト進捗状況 (PROGRESS.md)

## 📅 更新日: 2026年5月8日 (実装担当: Zenith Quality Engineer)

## ✅ 直近完了タスク (2026年5月8日) — Zenith Loader 実装完了 & push

### ChunkedDownloader (Zenith Loader) ✅

| 項目                 | 内容                                                                          |
| -------------------- | ----------------------------------------------------------------------------- |
| 新規ファイル         | `packages/core/src/storage/ChunkedDownloader.ts`                              |
| テストファイル       | `packages/core/src/storage/__tests__/ChunkedDownloader.test.ts` (11件 全通過) |
| 閾値                 | `config.size >= 32 MiB` 時に EngineLoader から自動委譲                        |
| チャンクサイズ       | デフォルト 4 MiB (`ChunkedDownloader.DEFAULT_CHUNK_SIZE`)                     |
| SRI 検証             | sha256/384/512 全体 + セグメント単位 (`ISegmentedSRI`)                        |
| ストレージキャッシュ | OPFS / IndexedDB / NodeFS 統合 (`IFileStorage`)                               |
| 進捗レポート         | `ProgressCallback` (connecting/downloading/completed)                         |
| 中断サポート         | `AbortSignal` (5分タイムアウト デフォルト)                                    |
| フォールバック       | Range 非対応サーバーは単一 `fetch` にフォールバック                           |
| 既存テストへの影響   | `config.size` 未指定リソースは従来パス維持 → 258テスト全通過                  |
| changeset            | `.changeset/zenith-loader.md` (core: minor)                                   |

**コミット**: `665899e8 feat(core): add ChunkedDownloader for HTTP Range-based large file download (Zenith Loader)`

---

## ✅ 直近完了タスク (2026年5月8日) — git push & CI 全通過 / Release PR 生成

### push & CI 結果

| ワークフロー                    | 結果                              |
| ------------------------------- | --------------------------------- |
| CI (lint/typecheck/build/test)  | ✅ success                        |
| E2E Tests (Playwright CT)       | ✅ success                        |
| ESLint                          | ✅ success                        |
| Deploy API Docs                 | ✅ success                        |
| Benchmarks (bench.yml 初回実行) | ✅ success                        |
| Release                         | ✅ success — Release PR #122 更新 |
| CodeQL                          | ✅ success                        |

**修正**: `@opentelemetry/api` peerDependency 追加後 `pnpm-lock.yaml` 未更新で `ERR_PNPM_OUTDATED_LOCKFILE` が発生 → `pnpm install` + `fix(ci)` コミットで解消

### Release PR #122 に含まれるバンプ

| パッケージ            | 変更前 | 変更後     | 理由                                         |
| --------------------- | ------ | ---------- | -------------------------------------------- |
| `core`                | 0.1.1  | **0.2.0**  | OtelBridge + Multi-Runtime Bridge (minor ×2) |
| `adapter-uci/usi/gtp` | 0.1.1  | **0.2.0**  | Multi-Runtime Bridge minor                   |
| `adapter-bridge`      | 0.1.0  | **1.0.0**  | Incomplete Information minor                 |
| `adapter-poker`       | 0.1.0  | **1.0.0**  | Incomplete Information minor                 |
| `domain-bridge/poker` | 0.1.0  | **0.2.0**  | Incomplete Information minor                 |
| `ui-react-monitor`    | 0.1.1  | **0.2.0**  | MultiEnginePanel minor                       |
| `ui-vue-monitor`      | 0.1.1  | **0.2.0**  | MultiEnginePanel minor                       |
| `ui-chess-elements`   | 0.1.1  | 0.1.2      | keyboard fix patch                           |
| 全依存パッケージ      | —      | patch bump | core 0.2.0 cascade                           |

→ **PR #122 をマージすると全パッケージが npm publish される**

---

## ✅ 直近完了タスク (2026年5月8日) — ドキュメント全面最新化

### ROADMAP.md / TASKS.md / PROGRESS.md 同期 ✅

| ドキュメント       | 修正内容                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------- |
| ROADMAP.md Phase 3 | `Swarm (Ensemble) Architecture` → `[x]` (adapter-ensemble 3戦略 + MultiEnginePanel UI 完成) |
| ROADMAP.md Phase 5 | `Continuous Benchmarking` → `[x]` (vitest bench + bench.yml 実装済み)                       |
| ROADMAP.md Phase 5 | `Self-Healing Docs` → `[x]` (TypeDoc 0 warnings + docs.yml GitHub Pages 自動デプロイ済み)   |
| TASKS.md L82       | `ui-react-monitor` CT テスト数: 54 → **64テスト** (MultiEnginePanel +10)                    |
| TASKS.md L175      | `ui-vue-monitor` CT テスト数: 47 → **57テスト** (MultiEnginePanel +10)                      |

---

## ✅ 直近完了タスク (2026年5月8日) — Multi-Engine Ensemble UI 実装

### MultiEnginePanel — React & Vue ✅

- **`MultiEnginePanel.tsx`** (`ui-react-monitor`):
  - `EngineEntry[]` を受け取り、上部にスコア比較バー・下部に EngineMonitorPanel の Grid を表示
  - エンジン数に応じてレスポンシブグリッド切替: 1→`grid-cols-1`, 2→`md:grid-cols-2`, 3+→`xl:grid-cols-3`
  - `onMoveClick(move, engineId)` コールバックで各パネルのクリックを識別
  - `EngineScoreSummary` 内部コンポーネント: `useEngineMonitor` で各エンジンのリアルタイムスコア・ステータスドットを表示
- **`MultiEnginePanel.vue`** + **`EngineSummaryItem.vue`** (`ui-vue-monitor`):
  - Vue SFC 2ファイル構成 (generic SFC + 内部 Summary)
  - `@moveClick(move, engineId)` イベントエミット対応
- **CT テスト**: React 10テスト + Vue 10テスト (計 **20テスト新規追加、全通過**)
  - 空配列→非表示、score comparison bar ARIA、engine list ARIA、grid クラス (1/2/3エンジン)、カスタムラベル、name fallback、初期スコア "—"、セパレーター divider 数
- **エクスポート追加**: `ui-react-monitor/src/index.ts`, `ui-vue-monitor/src/index.ts` に公開

---

## ✅ 直近完了タスク (2026年5月7日) — Continuous Benchmarking & Observability (OTel) 実装

### vitest bench — コアホットパス継続的性能計測 ✅

- **`ScoreNormalizer.bench.ts`**: cp/mate/winrate/reversi/go 各ドメイン × 4段階評価値 + 1000件バルクスループット計測
  - 実測: `ScoreNormalizer.normalize` (cp, chess) = **7.5M ops/s**、バルク 1000件 = **13.4k ops/s**
- **`ProtocolValidator.bench.ts`**: 短文字列/長文字列/FEN/オブジェクト/GTP許容/バルク 500件
  - 実測: `assertNoInjection("e2e4")` = **11.9M ops/s**、オブジェクト再帰 = **535k ops/s**
- **`vitest.config.ts`**: `bench` セクション追加 (`include: ["src/__benchmarks__/**/*.bench.ts"]`, `outputFile: bench-results.json`)
- **`package.json`**: `bench: "vitest bench"` スクリプト追加
- **`.github/workflows/bench.yml`**: push/PR to main トリガー → ベンチマーク実行 → artifact 保存 (90日) → PR にサマリーコメント自動投稿 (upsert)

### OtelBridge — OpenTelemetry ブリッジアダプター ✅

- **`OtelBridge`** クラス (`packages/core/src/middlewares/OtelBridge.ts`):
  - `IOtelTracer` / `IOtelSpan` 最小インターフェース定義 (`@opentelemetry/api` 非インストール環境でも型安全)
  - `OtelBridge.fromGlobal()` — `@opentelemetry/api` が存在する場合のみ `Function('return import(...)')()` で動的ロード、存在しない場合は `null` を返す
  - `OtelBridge.record(event)` — `ITelemetryEvent` を OTel スパンに変換 (performance→`engine.search`, lifecycle→`engine.lifecycle`, search→`engine.info`)
  - `OtelBridge.asCallback()` — `engine.onTelemetry()` に直接渡せるコールバックを返す
- **`peerDependencies`**: `@opentelemetry/api: >=1.9.0` を optional として追加
- **`middlewares/index.ts`**: `OtelBridge` を公開エクスポートに追加
- **テスト**: 7テスト追加 (247テスト全通過、38ファイル)

---

## ✅ 直近完了タスク (2026年5月7日) — API リファレンス TypeDoc 警告ゼロ達成

### TypeDoc 全パッケージドキュメント生成 ✅

- **Props 型エクスポート**: `ui-react-monitor` の 7 コンポーネント Props インターフェースを `export interface` に変更、`export *` でパブリック API に昇格
- **パーサークラスエクスポート**: `adapter-edax/EdaxParser`, `adapter-gnubg/GNUBGParser`, `adapter-mortal/MahjongJSONParser` を公開
- **KataGo 型エクスポート**: `KataGoTensors`, `Color` 型を `adapter-katago` から公開
- **AdapterFactory エクスポート**: `core` の bridge/index.ts → index.ts へ連鎖エクスポート追加
- **TSDoc リンク修正**: `BaseAdapter`, `WorkerCommunicator`, `NativeCommunicator`, `resolveRuntime` の `{@link}` をプレーンテキストに変更し「Failed to resolve」エラーを解消
- **Lit `styles` 除外**: 全 Lit コンポーネントの `static styles` に `/** @internal */` を付与し TypeDoc の CSS タグリンク警告を除去
- **typedoc.json 改善**: `externalSymbolLinkMappings` 追加 (`@lit/reactive-element/PropertyDeclaration`, `lit/css`, `@multi-game-engines/core/ICommunicator`), `highlightLanguages` に `tsx`/`vue` 追加, `packageOptions.excludeInternal: true` 追加
- **結果**: `npx typedoc --treatWarningsAsErrors` で **0 errors / 0 warnings** 達成、`docs/api/` 生成完了

---

## ✅ 直近完了タスク (2026年5月6日) — Incomplete Information ゲームアダプター実装

### domain-poker / domain-bridge / adapter-poker / adapter-bridge ✅

- **domain-poker**: `PokerCard`, `PokerAction` ブランド型、`IPokerSearchOptions/Info/Result` インターフェース、`createPokerCard/Action`, `parsePokerAction`, `pokerActionAsMove` ユーティリティ (13テスト全パス)
- **domain-bridge**: `BridgeCard`, `BridgeBid`, `BridgePlay` ブランド型、`IBridgeSearchOptions/Info/Result` インターフェース、`createBridgeCard/Bid/Play`, `bridgeChoiceAsMove` ユーティリティ (14テスト全パス)
- **adapter-poker**: `PokerAdapter` + `PokerJSONParser` — JSON プロトコル対応 GTO ソルバーアダプター。ブラウザ (WASM Worker) + ネイティブバイナリ両対応 (9テスト全パス)
- **adapter-bridge**: `BridgeAdapter` + `BridgeJSONParser` — GIB 互換エンジンアダプター。オークション/プレイ両フェーズ対応 (9テスト全パス)
- **i18n-common**: エンジンエラー i18n キー 5件追加 (`loaderRequired`, `missingSources`, `missingMainEntryPoint`, `nativeBinaryRequired`, `loadFailed`)
- **typedoc.json**: 4パッケージをドキュメント生成対象に追加
- changeset: `incomplete-information-adapters.md` を新規作成 (domain/adapter 各 `minor`, i18n-common `patch`)

---

## ✅ 直近完了タスク (2026年5月6日) — Multi-Runtime Bridge アダプター統合

### UCI / USI / GTP アダプターへの Native Path 統合 ✅

- `IEngineConfig` に `binaryPath?: string` フィールドを追加 (`packages/core/src/types.ts`)
- `isNodeEnvironment()` を `@multi-game-engines/core` の main entry からエクスポート
- `UCIAdapter` / `USIAdapter` / `GTPAdapter` に native path を統合:
  - `isNodeEnvironment() && config.binaryPath` が真の場合、`EngineLoader` 不要で `NativeCommunicator` を動的インポートしてネイティブバイナリを起動
  - ブラウザ/WASM パスは既存の `WorkerCommunicator` + `EngineLoader` フローを維持
- テスト: 各アダプターに `describe("... native mode")` ブロックを追加（3テスト×3アダプター = 9テスト全パス）
  - `vi.hoisted` + `vi.mock` パターンで動的インポートのモックを実現
- changeset: `multi-runtime-bridge.md` を更新し `adapter-uci/usi/gtp@minor` を追加

---

## ✅ 直近完了タスク (2026年5月4日) — アクセシビリティ修正

### ChessBoard 盤面反転時のキーボードナビゲーション修正 ✅ (`ui-chess-elements`)

- **問題**: `orientation="black"` 時に `_handleKeyDown` が方向キーを反転しておらず、ArrowUp が視覚的に下方向に移動する（WCAG 2.4.3 違反）
- **修正**: `flipped` フラグを導入し、全キー（↑↓←→/Home/End/PageUp/PageDown/Ctrl+組み合わせ）を視覚座標基準に切り替え ([`packages/ui-chess-elements/src/index.ts`](../packages/ui-chess-elements/src/index.ts))
- **テスト**: 反転表示専用テストスイート `chess-board keyboard navigation — orientation=black` を新設（14件追加、合計28件全パス）([`packages/ui-chess-elements/src/__tests__/ChessBoard.keyboard.test.ts`](../packages/ui-chess-elements/src/__tests__/ChessBoard.keyboard.test.ts))
- ARIA ラベルはすでに論理座標（代数表記）から生成されており、反転時も正しく読み上げられることを検証済み

---

## ✅ 直近完了タスク (2026年5月4日)

### Multi-Runtime Bridge ✅ (`core@0.2.0` — changeset作成済み)

- `ICommunicator` インターフェース追加 (`packages/core/src/workers/ICommunicator.ts`)
- `WorkerCommunicator` / `NativeCommunicator` が `ICommunicator` を実装
- `BaseAdapter.communicator` を `ICommunicator | null` に変更 (両コミュニケーター対応)
- `resolveRuntime(config)`: 実行環境を自動検出して適切なコミュニケーターを返す
  - Node.js 環境 → `NativeCommunicator(config.binaryPath)` (config.binaryPath 必須)
  - ブラウザ環境 → `WorkerCommunicator(config.workerUrl)` (config.workerUrl 必須)
- `isNodeEnvironment()`: `process.versions.node` の有無で Node.js/ブラウザを判定
- `RuntimeConfig` 型: `{ workerUrl?: string; binaryPath?: string }`
- 全シンボルを `core/index.ts` からエクスポート
- テスト: `resolveRuntime.test.ts` — 10テスト全パス (class-based mocks + instanceof assertions)

---

## ✅ 直近完了タスク (2026年5月3日)

### Playwright CT テスト大幅拡充 ✅

- `ui-react-monitor`: 6テスト → **31テスト** (EvaluationGraph×8, PVList×7, SearchLog×10 追加)
- `ui-vue-monitor`: 6テスト → **31テスト** (EvaluationGraph×8, PVList×7, SearchLog×10 追加)
- 合計: 12テスト → **62テスト** (両フレームワークで対称カバレッジ実現)

### `refresh-sri.yml` 改善 ✅

- `workflow_run` トリガー追加: "Deploy API Docs" 完了後に SRI ハッシュ自動再計算
- WASM デプロイ → SRI 更新の完全自動化

### 依存関係アップデート (PR #119, #120) ✅ マージ済み

- PR #119: ESLint 10.3.0、turbo 2.9.7、zod 4.4.2、@eslint-react/eslint-plugin 5.7.0、vite-plugin-dts 5.0.0、jsdom 29.1.1、@vue/test-utils 2.4.10、postcss 8.5.13、wrangler 4.87.0、@cloudflare/workers-types 4.20260502.1
- PR #120: turbo 2.9.8、@eslint-react/eslint-plugin（追加更新）、@swc/core、@cloudflare/workers-types

---

## ✅ 直近完了タスク (2026年5月2日)

### Phase B2: KataGo ONNX アダプター ✅ (npm publish 完了: adapter-katago@0.2.0)

- `KataGoONNXAdapter`: onnxruntime-web 使用、Worker・バイナリ不要
- `KataGoBoard` + `KataGoEncoder`: 19×19 盤面管理と 22 プレーン特徴量エンコード
- CI: `build-wasm.yml` に `build-katago` ジョブ追加
- `adapter-katago@0.2.0` npm 公開済み

### Phase B2: rapid-draughts チェッカー ✅ (npm publish 完了: adapter-kingsrow@0.2.0)

- `KingsRowAdapter` を rapid-draughts@1.0.6 (純粋 TypeScript) で置き換え
- Worker・バイナリ・CDN URL 不要。`bundled: true` マーカーをレジストリに追加
- `adapter-kingsrow@0.2.0` npm 公開済み

---

## ✅ 直近完了タスク (2026年5月1日)

### v0.1.5 npm リリース ✅

**公開パッケージ** (13 packages, 2026-05-01):

- `@multi-game-engines/registry@0.1.5` — gnubg 1.05 SRI ハッシュ確定、`__unsafeNoSRI` 除去
- 全アダプター (`adapter-edax`, `adapter-gnubg`, `adapter-gtp`, `adapter-katago`, `adapter-kingsrow`, `adapter-mortal`, `adapter-stockfish`, `adapter-uci`, `adapter-usi`, `adapter-yaneuraou`) @0.1.5
- `@examples/zenith-dashboard-react@0.1.5`, `@examples/zenith-dashboard-vue@0.1.5`

(v0.1.4 も同日公開: Edax 4.4 SRI ハッシュ確定)

---

### Phase B2: gnubg WASM ビルドパイプライン ✅ (完了)

**目的**: GNU Backgammon (gnubg) を Emscripten でコンパイルし、GitHub Pages 経由で配信。

**実装内容**:

- **`scripts/build-gnubg-wasm.sh`** — Emscripten ビルドスクリプト:
  - `hwatheod/gnubg-web` レシピ使用 (gnubg v1.05.000 + glib 2.62.0)
  - Edax と異なり ASYNCIFY 不要 — `_run_command()` を直接エクスポート
  - `--preload-file packaged_files@/`: neural net weights + bearoff DBs (~2MB) を WASM に埋め込み
  - Post-build `getpwuid` stub パッチ (Emscripten issue #13219)
  - 出力: `gnubg.module.js` (78KB) + `gnubg.module.wasm` (920KB) + `gnubg.module.data` (2MB)

- **`scripts/gnubg-worker.js`** — Web Worker エントリポイント:
  - `Module._run_command(buf)` を直接呼び出し (同期処理)
  - 複数の `print()` 呼び出しをバッファリングしてまとめて `postMessage`
  - Edax より遥かにシンプルなアーキテクチャ

- **CI ワークフロー**: `build-gnubg` ジョブを `build-wasm.yml` に追加
  - 初回ビルド 60 秒で成功 (Edax の ~2分より高速)
  - artifact `gnubg-wasm-v1.05` → `docs.yml` が自動ダウンロード・Pages 配信

**SRI ハッシュ** (engines.json v0.1.5):

- `gnubg.js`: `sha384-WRBJSfKm7j+l4tL4rdf/g1M4GCdj65F3I6yv7GQltFv7C/jL2bsDzQ7IPJ0ksiAv`
- `gnubg.wasm`: `sha384-sI5LANu1QAohgAlTomZv2CxFmpYIUPgEVxcveCRQrxZ/IAXbQOgNY3dBz2Gh6Bk3`

---

### Phase B2: Edax WASM Emscripten ビルドパイプライン ✅ (完了)

**目的**: Edax (Othello/Reversi) を Emscripten ASYNCIFY でコンパイルし、GitHub Pages 経由で配信。

#### 調査結果サマリー (Phase B2 研究)

| エンジン          | WASM 入手可否      | 方針                                                            | ステータス                      |
| ----------------- | ------------------ | --------------------------------------------------------------- | ------------------------------- |
| **Edax 4.4**      | ❌ 事前ビルド無し  | Emscripten ASYNCIFY ビルド (abulmo/edax-reversi)                | ✅ 完了 (v0.1.4)                |
| **KataGo 1.14**   | ❌ 独立 .wasm 無し | ONNX Runtime Web (kaya-go/katago-onnx) — アーキテクチャ変更必要 | 🔬 調査中                       |
| **gnubg 1.05**    | ❌ 事前ビルド無し  | Emscripten ビルド (hwatheod/gnubg-web レシピ使用)               | ✅ 完了 (v0.1.5 pending)        |
| **KingsRow 1.61** | 🚫 不可            | **BLOCKED** — プロプライエタリ DLL のみ、ソース非公開           | 🚫 代替案: rapid-draughts (MIT) |
| **Mortal 1.0**    | 🚫 不可            | **BLOCKED** — PyTorch ベース、直接 WASM 化不可                  | 🚫 ONNX 変換調査中              |

#### 実装内容

- **`scripts/build-edax-wasm.sh`** — Emscripten ASYNCIFY ビルドスクリプト:
  - `abulmo/edax-reversi v4.4.0` (GPL-2.0-or-later) をコンパイル
  - `-sASYNCIFY=1`: C の fgets() ブロッキング読み込みを WASM で機能させる
  - `--preload-file data@/data`: `eval.dat` (評価関数) を WASM バイナリに埋め込み
  - 出力: `edax.module.js` + `edax.module.wasm`

- **`scripts/edax-worker.js`** — Web Worker エントリポイント (ソースコミット済み):
  - `postMessage` ↔ Edax stdin/stdout ブリッジ
  - `Asyncify.handleSleep()` によるブロッキング stdin の実装
  - EdaxAdapter が期待するテキストプロトコルを中継

- **`.github/workflows/build-wasm.yml`** — Emscripten CI ビルドワークフロー:
  - `mymindstorm/setup-emscripten@v14` (Emscripten 4.0.10) を使用
  - ビルド成果物は `edax-wasm-v4.4.0` artifact としてアップロード
  - バージョン付きキャッシュキーでコンパイル結果を再利用

- **`docs.yml` 更新**:
  - `workflow_run` トリガー追加: `build-wasm.yml` 完了後に自動 Pages 再デプロイ
  - `dawidd6/action-download-artifact@v9` で Edax WASM artifact をダウンロード
  - `assets/edax/4.4/` へステージング → GitHub Pages に配信

- **`engines.json` メタデータ整備**:
  - 全 Phase B2 エンジンに `_phase`, `_wasm_path`, `_note` フィールド追加
  - KingsRow: `_phase: blocked` (プロプライエタリ)
  - Mortal: `_phase: blocked` (PyTorch ベース)

- **`scripts/assets-manifest.json` v1.1**:
  - Phase B2 研究結果を全エンジンに記録

**完了内容**:

- Edax WASM CI パイプライン構築・動作確認
- SRI ハッシュ `sha384-31h7F4nhhlpCVqDsO2Rn0//aILszVJWM3fQI5Ab+GPhfB2JaxPtJ9m6vLBNqyjpW` を `engines.json` に記録
- `__unsafeNoSRI: true` 除去 → 本番環境で Edax 利用可能
- v0.1.4 として npm 公開完了

**完了** (v0.1.4, v0.1.5 で両エンジン公開済み)

**次のアクション**:

1. KataGo — ONNX Runtime Web 統合 (アーキテクチャ検討)
2. KingsRow → rapid-draughts (MIT) 置き換え検討

---

## ✅ 直近完了タスク (2026年4月30日)

### Phase B1: WASM アセット配信インフラ — 完了 ✅ (PR #108, #109)

**目的**: `__unsafeNoSRI` エンジンのバイナリを CDN 配信し、SRI ハッシュで本番利用可能化。

- **[B1-1] GitHub Pages アセット配信基盤** (PR #108):
  - `docs.yml` 拡張: TypeDoc デプロイと同一 Pages アーティファクトに WASM バイナリを同梱
  - GPL バイナリはソースに commit せず CI でダウンロード（ADR-014 準拠）
  - `actions/cache` でアーカイブをキャッシュ（キー: `wasm-yaneuraou-v7.5.0-alpha.4`）
  - **やねうら王 7.5 WASM ライブ配信開始**:
    - `https://hdkz-dev.github.io/multi-game-engines/assets/yaneuraou/7.5/yaneuraou.js` (51 KB)
    - `https://hdkz-dev.github.io/multi-game-engines/assets/yaneuraou/7.5/yaneuraou.wasm` (559 KB)
    - CORS ヘッダー (`Access-Control-Allow-Origin: *`) 付きで配信確認済み
  - `scripts/assets-manifest.json` 新規作成（ダウンロード設定の source-of-truth）

- **[B1-2] やねうら王 SRI ハッシュ確定** (PR #109):
  - `pnpm sri:refresh` を実行し実 SHA-384 を取得・`engines.json` に記録
  - `__unsafeNoSRI: true` フラグを除去 → **本番環境でやねうら王が初めて利用可能に**
  - `EngineLoader` が SRI を強制検証 → バイナリ改ざん・CDN ハイジャックをブロック

**エンジンバイナリ使用元**: `mizar/YaneuraOu.wasm v7.5.0-alpha.4` (material variant, GPL-3.0)

- material variant = 駒得評価（外部 .nnue ファイル不要、自己完結型）
- マルチスレッド（pthreads）対応: コンシューマーアプリ側で COOP+COEP ヘッダー必要

**Phase B2 状況**: → 上記 2026年5月1日 セクション参照

---

### Dependabot PR #107 マージ & CI 確認 — 完了 ✅

- **PR #107 マージ**: `chore(deps): bump the dependencies group with 18 updates`
  - 主な更新: `typescript`, `vitest`, `vite`, `eslint` 等 18 パッケージ
  - マージ後の Release ワークフローは `No unpublished projects to publish`（v0.1.1 既公開）のため新 publish なし
  - 全 CI チェック（CI / E2E / ESLint / Deploy API Docs）グリーン ✅

### ⚠️ NPM_TOKEN ローテーション — 要対応

- **旧トークン**: 2026-05-05 期限切れ → 既に新しい Granular Token に更新済み
- **現在のトークン有効期限**: 2026-07-29 頃（90日）
- **⚠️ セキュリティ注意**: チャット上にトークン値が表示されたため、**即時ローテーションを強く推奨**
  1. [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens) → 該当トークンを「Revoke」
  2. 新しい Granular Access Token を作成（90日 / Bypass 2FA / `@multi-game-engines/*` Read+Write）
  3. `gh secret set NPM_TOKEN`

---

## ✅ 直近完了タスク (2026年4月29日)

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

### ✅ 全 47 パッケージ npm 初回 publish 完了 + v0.1.1 リリース（2026年4月29日）

- **v0.1.0 公開状況**: `@multi-game-engines/*` 全 47 パッケージ v0.1.0 が npmjs.com に公開済み
  - 25件: 2026-04-28 `changeset publish` で公開
  - 1件: 2026-04-29 ローカルでレートリミット解除確認後に公開
  - 21件: 2026-04-29 `initial-publish.yml` GitHub Actions ワークフロー経由で公開（E429 回避）
- **v0.1.1 リリース**: Dependabot PR #100-103 のマージ後、Release ワークフローが自動 publish を実行
  - PR #106 (Version Packages) のマージにより全 47 パッケージ v0.1.1 が npm publish 完了
- **認証方式**: GitHub Secrets の `NPM_TOKEN`（Granular Token、Bypass 2FA 有効）
- **release.yml**: `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` で認証済み（main push 時に自動 publish）
- **ESLint ワークフロー**: PR #105 で追加、pnpm + ESLint v10 (Flat Config) 対応済み（SARIF → GitHub Security upload）
- **重要な学び**: npm には PyPI の「Trusted Publishers API」は存在しない。OIDC は provenance 署名用のみ。

### ✅ GitHub Pages 有効化済み

- リポジトリ Settings → Pages → Source を "GitHub Actions" に設定済み
- main push 時に TypeDoc が自動デプロイされる

### ✅ やねうら王 7.5 本番利用可能 (2026-04-30)

- SRI ハッシュ確定済み（PR #108/#109 マージ）
- 配信 URL: `https://hdkz-dev.github.io/multi-game-engines/assets/yaneuraou/7.5/`
- 利用条件: アプリ側で `COOP+COEP` ヘッダーが必要（SharedArrayBuffer 要件）

### ✅ Phase B2 — 残エンジンの WASM ビルドパイプライン (完了)

- ✅ **Edax 4.4** (リバーシ): Emscripten ASYNCIFY ビルド完了、SRI確定済み
- ✅ **KataGo 1.14** (囲碁): onnxruntime-web ONNX アダプター実装 (adapter-katago@0.2.0)
- ✅ **gnubg 1.05** (バックギャモン): Emscripten ビルド完了、SRI確定済み
- ✅ **KingsRow** (チェッカーズ): rapid-draughts@1.0.6 (純粋TS) で置き換え (adapter-kingsrow@0.2.0)
- ⛔ **Mortal 1.0** (麻雀): PyTorch ベース — 純粋 JS/TS 代替なし、DEFERRED

### 🔴 要対応 — NPM_TOKEN の期限管理

- [ ] **NPM_TOKEN の即時ローテーション**: チャット上にトークン値が露出 → **今すぐ Revoke して再発行すること**
  1. [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens) → 該当トークンを「Revoke」
  2. 新しい Granular Access Token を作成（90日 / Bypass 2FA 有効 / `@multi-game-engines/*` Read+Write）
  3. `gh secret set NPM_TOKEN`（プロンプトに新トークンを貼り付け）
- [ ] **次回 NPM_TOKEN 期限更新**: 現トークン有効期限は **2026年7月29日** 頃。事前にカレンダーリマインダーを設定すること
- [ ] **自社ホスティング済みバイナリの SRI 確定**: やねうら王・KataGo・Edax・gnubg・KingsRow・Mortal は実バイナリをデプロイし SHA-384 を算出して `engines.json` の `__unsafeNoSRI` を置換する（別リポジトリ `multi-game-engines-assets` にて作業）
  > **備考**: `__unsafeNoSRI` は本番 (`NODE_ENV=production`) では `SECURITY_ERROR` で自動遮断済みの開発フラグ。

### ✅ High Priority — Phase B（バイナリ配信インフラ）

- ✅ **Phase B1**: GitHub Pages 配信設定完了
- ✅ **Phase B2**: やねうら王 WASM ビルドパイプライン (Emscripten) 完了
- ✅ **Phase B3**: Edax / gnubg / KataGo(ONNX) / KingsRow(rapid-draughts) 完了
- ✅ **Phase B4**: SRI 自動再計算 CI (`refresh-sri.yml` — docs デプロイ後に自動トリガー)

### 🟡 Medium Priority

- ✅ **Playwright E2E 拡充**: 両 monitor パッケージで CT テスト拡充完了 — React 54テスト / Vue 47テスト (合計 101)
- ✅ **Release Automation**: `@changesets/changelog-github` 導入で per-package CHANGELOG に PR リンク・Author 情報を自動付与。`version` スクリプト追加、`release.yml` に `fetch-depth: 0` 設定
- ✅ **Security & SRI Integration**: `refresh-engine-sris.mjs` に `sri-hashes/*.txt` 読み込み機能追加 — CI ビルド後の SRI ハッシュをローカルファイル経由で自動適用できるよう完全自動化
- ✅ **英語版ドキュメント拡充**: `docs/en/` 全 5 ファイルを日本語版と同期 — ROADMAP / DECISION_LOG / ARCHITECTURE / ZENITH_STANDARD / TECHNICAL_SPECS に Multi-Runtime Bridge・Incomplete Info・Hardware Acceleration・CT テスト数等を追記
- ✅ **Multi-Runtime Bridge**: `resolveRuntime()` + `ICommunicator` — WASM と OS Native バイナリを自動切替 (`core@0.2.0`)
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
