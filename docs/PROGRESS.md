# プロジェクト進捗状況 (PROGRESS.md)

## 📅 更新日: 2026年2月26日 (実装担当: Federated i18n Architecture)

## 📈 稼働中のタスク

### 1. Federated i18n Architecture の完遂 (Zenith Tier)

- [x] 言語リソースの物理パッケージ分離 (`i18n-core`, `common`, `chess`, `shogi`, `engines`, `dashboard`)
- [x] 全 45 パッケージの完全移行と旧 `packages/i18n` の削除
- [x] Zero-Any Policy に基づく再帰的 `DeepRecord` 型による型安全化
- [x] 全テストスイートの同期とスナップショット更新

## 🏆 到達ハイライト (2026-02-26 Federated i18n Architecture)

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
