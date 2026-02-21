# 拡張アダプター監査・修復計画書 (2026-02-20)

## 1. 概要

2026年2月20日に実施された CodeRabbit および AI セキュリティ監査により特定された、拡張アダプター群（Edax, Mortal, GNUBG, KingsRow）および既存基盤の課題を整理し、修復手順を定義します。

## 2. 指摘事項と優先度

### 🔴 Critical (最優先)

- **SRI 検証のバイパス**: `GTPAdapter`, `KingsRowAdapter` 等において、`loader` 未指定時に直接 URL をロードしており、ハッシュ検証が行われない。
  - **対策**: `core` の `EngineLoader` をデフォルトで使用することを強制し、検証済みパスのみを許可する。

### 🟠 High (高)

- **ブランド型のブランド衝突**: `GOMove` 等の `Move & { __brand: "GOMove" }` 定義が既存ブランドと衝突し、型安全性が形骸化している。
  - **対策**: `PositionString` パターンを採用し、`Move` を継承しつつ一意なブランドを付与する。
- **コマンド・インジェクションの脆弱性**: `Parser.ts` の `createOptionCommand` においてサニタイズが不十分。
  - **対策**: `ProtocolValidator.assertNoInjection` を全てのコマンド生成ロジックに適用。
- **SSR 環境でのクラッシュ**: Vue 版ダッシュボードのコンポーザブルが `window` を直接参照。
  - **対策**: `typeof window` ガードを追加。
- **ファクトリの戻り値不一致**: 内部向け `IEngineAdapter` をそのまま公開 API として返却している。
  - **対策**: `EngineFacade` でラップした `IEngine` を返すように修正。

### 🟡 Medium (中)

- **設定オブジェクトの無視**: `createMortalAdapter` 等で `config` がコンストラクタに渡されていない。
- **エラーメッセージのローカライズ欠落**: パーサー内のエラーが英語でハードコードされている。

### 🔵 Low (低)

- **README テンプレートの残存**: KingsRow 等の README が UCI/Chess の記述のまま。
- **scripts の実行権限**: `git restore` されたスクリプトの実行ビットの再設定。

## 3. 実行ロードマップ

1. **Phase 1: セキュリティ & 型の硬格化** (Critical/High の修正)
2. **Phase 2: 公開 API & DX の整備** (High/Medium の修正)
3. **Phase 3: ドキュメント & インフラの最終化** (Low の修正)
