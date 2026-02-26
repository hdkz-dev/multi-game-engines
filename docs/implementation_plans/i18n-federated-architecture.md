# Implementation Plan: Federated i18n Architecture

> [!IMPORTANT]
> **Status: Completed / Formalized in [ADR-049](../adr/049-federated-i18n-architecture.md)**  
> The physical separation of i18n packages and Zero-Any type safety have been successfully implemented as of 2026-02-26.

## 1. 目的
現在の `i18n` パッケージによる暗黙的な全データ結合を廃止し、物理的なパッケージレベルでの分離を実現する。これにより、未使用ドメインの言語リソースが `node_modules` およびバンドルに混入することを物理的に不可能にする。

## 2. 新しいパッケージ構成
| パッケージ名 | 役割 | 依存先 |
| :--- | :--- | :--- |
| `@multi-game-engines/i18n-core` | 翻訳エンジンのロジック (t関数等) | なし |
| `@multi-game-engines/i18n-common` | 共通語彙データ (Status, Ready等) | `i18n-core` |
| `@multi-game-engines/i18n-chess` | チェス固有データ | `i18n-core` |
| `@multi-game-engines/i18n-shogi` | 将棋固有データ | `i18n-core` |
| `@multi-game-engines/i18n-dashboard` | ダッシュボードUI専用データ | `i18n-core` |

## 3. 移行ステップ

### Phase 1: `i18n-core` の抽出
- [ ] `packages/i18n-core` を新設。
- [ ] `t()` 関数、型定義、オブジェクトパス解決ロジックを移動。

### Phase 2: データパッケージの分立
- [ ] 各ドメインの JSON をそれぞれの新パッケージ (`i18n-chess` 等) へ移動。
- [ ] 各パッケージで、そのドメイン専用の `t*` 関数をエクスポート。

### Phase 3: 全パッケージの依存関係の刷新
- [ ] 各 `adapter-*`、`ui-*` パッケージの `package.json` を更新。
- [ ] インポートパスを `@multi-game-engines/i18n` からそれぞれの専用パッケージへ変更。

### Phase 4: `packages/i18n` (Monolithic) の削除
- [ ] 全ての移行が完了した後、旧パッケージを完全に削除。

## 4. 完了定義 (Done Criteria)
1. `pnpm list --rev-deps @multi-game-engines/i18n-chess` を実行した際、チェス関連パッケージ以外が表示されないこと。
2. 将棋アプリのビルドにおいて、チェスのデータが物理的に存在しないことを確認する。
3. 全 40 パッケージのビルド・テストがパスすること。
