# 変更履歴 (Changelog)

> 最終更新: 2026-04-21

このドキュメントには、プロジェクトの変更履歴を記録します。

---

## 2026-04-21

### テストカバレッジの大規模改善

#### 🆕 新規テストファイル

| ファイル                                                           | 対象パッケージ     | 内容                                                                                                            |
| ------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `packages/ui-elements/src/__tests__/components.test.ts`            | `ui-elements`      | `SearchLogElement` のスクロール・move-click イベントテスト                                                      |
| `packages/ui-react-monitor/src/__tests__/SearchLog.test.tsx`       | `ui-react-monitor` | `SearchLog` React コンポーネントの全パステスト                                                                  |
| `packages/ui-vue-monitor/src/__tests__/components.test.ts`         | `ui-vue-monitor`   | Vue モニターコンポーネントのレンダリング・イベントテスト                                                        |
| `packages/adapter-katago/src/__tests__/createKataGoEngine.test.ts` | `adapter-katago`   | KataGo エンジン生成ファクトリのテスト                                                                           |
| `packages/domain-*/src/__tests__/*.edge.test.ts` (×10)             | 各ゲームドメイン   | backgammon / checkers / chess / go / gomoku / janggi / mahjong / reversi / shogi / xiangqi のエッジケーステスト |

#### 📝 拡張テストファイル (主要変更)

| ファイル                                                                     | 改善内容                                                                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `packages/core/src/adapters/__tests__/BaseAdapter.test.ts`                   | `handleStreamCancel` ライフサイクル、`clearListeners` カバレッジ追加                                       |
| `packages/core/src/bridge/__tests__/EngineFacade.test.ts`                    | 並行 `load()`、`dispose()` 中の検索停止、`use()`/`unuse()`、全イベントリスナー、`emitTelemetry` 無効化パス |
| `packages/core/src/bridge/__tests__/EngineBatchAnalyzer.test.ts`             | `CANCELLED` エラー再スロー、`analyzePriority` 中の致命的エラー伝播                                         |
| `packages/core/src/bridge/__tests__/EngineConcurrencyController.test.ts`     | `updateStatus("ready"/"error")` による active 解放パス                                                     |
| `packages/core/src/bridge/__tests__/EngineLoader.test.ts`                    | JSON/text MIME タイプ、無効 URL フォーマット拒否                                                           |
| `packages/core/src/workers/__tests__/ResourceInjector.test.ts`               | `waitForReady`、`listen()`、`interceptFetch`、`adaptEmscriptenModule`、`mountToVFS` の全パス               |
| `packages/core/src/middlewares/__tests__/DefaultTelemetryMiddleware.test.ts` | `onInfo`/`onProgress` パス、`performance.memory` / `measureUserAgentSpecificMemory` サンプリング           |
| `packages/core/src/mocks/__tests__/MockAdapter.test.ts`                      | 検索中 stop、`onStatusChange`/`onProgress` リスナーオーバーライド                                          |
| `packages/ui-react-monitor/src/__tests__/EngineMonitorPanel.test.tsx`        | キーボードナビゲーション (Arrow/Home/End)、エラー状態 (i18nKey / remediation)、mate スコアアナウンス       |
| `packages/ui-react-monitor/src/__tests__/useEngineMonitor.test.tsx`          | ステータス変更伝播、アンマウント時クリーンアップ、null エンジン時のデフォルト状態                          |
| `packages/ui-react-monitor/src/mocks/__tests__/MockEngine.test.ts`           | `load()` ライフサイクル、`failOnSearch`、ミドルウェア、テレメトリ購読/解除                                 |

#### 📊 カバレッジ改善結果

| パッケージ              | 改善前 | 改善後     |
| ----------------------- | ------ | ---------- |
| `i18n-core`             | ~85%   | **100%**   |
| `ui-react-core`         | 71.42% | **100%**   |
| `registry`              | 85.86% | **93.47%** |
| `ui-shogi-elements`     | 75.91% | **98.54%** |
| `ui-vue-monitor`        | 78.32% | **94.4%**  |
| `ui-core` (ui-vue-core) | 81.66% | **93.33%** |
| `ui-elements`           | 68.21% | **96.02%** |
| `ui-react-monitor`      | 63.76% | **97.7%**  |
| `core`                  | 76.26% | **84.23%** |

#### 🔑 主要な技術的発見

- `EngineUIProvider` はデフォルトで日本語ロケール (`commonLocales.ja`) を使用するため、英語文字列テストでは `vi.mock("@multi-game-engines/ui-react-core")` パターンが必須
- `createMove("e2e4")` は Branded String であり、`.toString()` で元の文字列が返る
- `ResourceInjector.listen()` は `globalThis.addEventListener` に登録されるため、テストでは handler を直接キャプチャして呼び出す必要がある
- `EngineFacade` の `dispose()` 中に進行中の検索がある場合、`CANCELLED` エラーが発生するため `.catch(() => {})` で抑制が必要

---

## 2026-02-06

### ドキュメント追加・更新

#### 🆕 新規作成

| ファイル                                                   | 内容                                |
| ---------------------------------------------------------- | ----------------------------------- |
| `docs/implementation_plans/core-package-implementation.md` | Core パッケージ完全実装の詳細計画書 |
| `docs/knowledge/README.md`                                 | ナレッジベースのインデックス        |
| `docs/knowledge/ARCHITECTURE_KNOWLEDGE.md`                 | アーキテクチャと設計原則            |
| `docs/knowledge/COMPONENT_DESIGN.md`                       | コンポーネント設計詳細              |
| `docs/knowledge/SESSION_LOG.md`                            | 作業セッションログ                  |
| `docs/knowledge/CHANGELOG.md`                              | 変更履歴 (本ファイル)               |

#### 📝 更新

| ファイル           | 変更内容                                          |
| ------------------ | ------------------------------------------------- |
| `docs/TASKS.md`    | Sprint ベースの構造に再編成、計画書へのリンク追加 |
| `docs/PROGRESS.md` | 本日の進捗記録追加、ステータス更新                |

#### 🔧 修正

| ファイル                                                   | 修正内容                                |
| ---------------------------------------------------------- | --------------------------------------- |
| `docs/implementation_plans/core-package-implementation.md` | Markdown lint エラー修正 (MD040, MD029) |

---

## テンプレート: 新規エントリ

```markdown
## YYYY-MM-DD

### [カテゴリ]

#### 🆕 新規作成

| ファイル       | 内容   |
| -------------- | ------ |
| `path/to/file` | [説明] |

#### 📝 更新

| ファイル       | 変更内容   |
| -------------- | ---------- |
| `path/to/file` | [変更内容] |

#### 🔧 修正

| ファイル       | 修正内容   |
| -------------- | ---------- |
| `path/to/file` | [修正内容] |

#### 🗑️ 削除

| ファイル       | 理由   |
| -------------- | ------ |
| `path/to/file` | [理由] |
```

---

## アイコン凡例

| アイコン | 意味                |
| -------- | ------------------- |
| 🆕       | 新規作成            |
| 📝       | 更新・変更          |
| 🔧       | バグ修正・lint 修正 |
| 🗑️       | 削除                |
| ⚡       | パフォーマンス改善  |
| 🔒       | セキュリティ関連    |
| 📦       | 依存関係更新        |
| 🧪       | テスト追加・修正    |
