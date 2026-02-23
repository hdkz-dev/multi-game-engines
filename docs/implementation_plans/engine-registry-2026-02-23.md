# Implementation Plan: Pluggable Engine Registry

## 概要

ADR-047 に基づき、エンジンのメタデータ（URL/SRI）を集中管理し、プラグイン可能にするレジストリ層を導入します。

## 実装ステップ

### Phase 1: 基盤構築 (Base Infrastructure)

- [ ] `packages/core`: `IEngineRegistry` インターフェースの定義。
- [ ] `packages/core`: `EngineBridge` に `addRegistry` メソッドを追加し、解決チェーンを実装。
- [ ] `packages/registry`: 新規パッケージのスカフォールディング (`package.json`, `tsconfig.json`)。
- [ ] `packages/registry`: `engines.json` のスキーマ定義と初期データの作成。

### Phase 2: 公式レジストリの実装

- [ ] `packages/registry`: `StaticRegistry` クラスの実装。
- [ ] `packages/core`: デフォルトで `StaticRegistry` を使用するように `EngineBridge` を更新。

### Phase 3: アダプターのリファクタリング

- [ ] `packages/adapter-stockfish`: ハードコードを削除し、レジストリを参照するように変更。
- [ ] `packages/adapter-yaneuraou`: 同上。
- [ ] `packages/adapter-katago`: 同上。
- [ ] `packages/adapter-edax`: 同上。
- [ ] `packages/adapter-mortal`: 同上。

### Phase 4: 検証と自動化

- [ ] `scripts/calculate-sri.ts`: URL から SRI ハッシュを自動生成するツールの作成。
- [ ] E2E テストでの動作確認（レジストリ経由でのロード）。

## 完了定義 (Done Criteria)

1. 全アダプターから URL/SRI のハードコードが消滅していること。
2. ユーザーが独自の `IEngineRegistry` を実装してブリッジに登録できること。
3. `engines.json` の更新だけで全アダプターの配信設定を変更できること。
4. SRI 検証が引き続き正常に機能し、不正なハッシュでエラーになること。
