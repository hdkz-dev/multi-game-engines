# Implementation Plan: Modular i18n Architecture (Pay-as-you-go)

> [!IMPORTANT]
> **Status: Completed / Superseded by [ADR-049](../adr/049-federated-i18n-architecture.md)**  
> This plan served as an intermediate step. The project has since moved to a fully physical package separation (Federated i18n Architecture).

## 1. 目的と背景
現在の `i18n` パッケージは、一つの JSON ファイルに全ての言語データ（チェス、将棋、囲碁など）が統合されており、どのパッケージから利用しても全データがバンドルされる「オーバーフェッチ」の状態にある。
これを解消し、必要なゲームのデータのみを軽量にインポートできる「Pay-as-you-go」アーキテクチャへ移行する。

## 2. アーキテクチャ設計
`@multi-game-engines/i18n` パッケージを以下のエントリポイントに分割する。

- `@multi-game-engines/i18n-common`: 共通語彙（開始、停止、エラー基盤）
- `@multi-game-engines/i18n-chess`: チェス固有（駒名、FENエラー等）
- `@multi-game-engines/i18n-shogi`: 将棋固有（駒名、SFENエラー等）
- `@multi-game-engines/i18n-dashboard`: ダッシュボード UI 専用文言

## 3. 実装ステップ

### Phase 1: データ構造の刷新
- [ ] `packages/i18n/src/locales/` 下の JSON をカテゴリ別に分割。
  - `common.json`, `chess.json`, `shogi.json`, `engines.json`, `dashboard.json`
- [ ] 言語（ja/en）ごとにファイルを管理しつつ、カテゴリ単位でのマージロジックを実装。

### Phase 2: エクスポート構成の変更
- [ ] `packages/i18n/package.json` の `exports` フィールドを更新。
- [ ] `tsup.config.ts` を更新し、複数のエントリポイントからビルド。

### Phase 3: 型定義の細分化
- [ ] `ValidI18nKey` を、`CommonKey`, `ChessKey` 等のサブタイプに分割。
- [ ] 各ゲームのパッケージが、自身に関連する型のみを使用するように強制。

### Phase 4: コンシューマの移行
- [ ] `ui-chess-elements` → `@multi-game-engines/i18n-chess`
- [ ] `ui-shogi-elements` → `@multi-game-engines/i18n-shogi`
- [ ] `core` → `@multi-game-engines/i18n-common`

## 4. 完了定義 (Done Criteria)
1. 将棋アプリのバンドルに、チェスの駒名（"King", "Queen"等）が含まれていないこと。
2. 従来の `import { t } from "@multi-game-engines/i18n"` も互換性のために維持（推奨されない方法としてマーク）。
3. 全パッケージの型チェックがパスすること。
