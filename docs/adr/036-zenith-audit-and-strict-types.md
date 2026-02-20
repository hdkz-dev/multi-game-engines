# ADR-036: Zenith Tier PR 監査とモノレポ全域の厳格な型安全性の再適用 (Zenith Tier PR Audit and Project-wide Strict Type Safety Enforcement)

## 状況 (Context)

プロジェクトが Zenith Tier (最高品質標準) に到達する過程で、マージ済みの複数のプルリクエスト（#15, #21, #24, #25）における合計 100 以上のレビューコメントを再精査した結果、いくつかの高度な型安全性の欠如や、環境設定の不一致が発見されました。特に、`exactOptionalPropertyTypes: true` の一時的な無効化や、`MonitorRegistry` 等のシングルトンにおける `any` の残存、および SRI (Subresource Integrity) ハッシュの形式不一致は、Zenith Tier の達成を妨げる要因となっていました。

## 決定 (Decision)

1. **`exactOptionalPropertyTypes: true` の完全復旧**:
   - `tsconfig.base.json` および各パッケージの `tsconfig.json` において、`undefined` の代入を厳格に制限する `exactOptionalPropertyTypes` を有効化しました。
   - これに伴い、Vue/React 等の UI コンポーネントにおいて、オプションプロパティが `undefined` を受け取れるよう型定義を `T | undefined` へ明示的に拡張しました。

2. **Zero-Any 監査の完遂**:
   - `MonitorRegistry` における `WeakMap` のキーと値を、`any` から最も抽象的なベースインターフェース（`IEngine`, `IBase*`）へと変更し、不透明なキャストを排除しました。
   - Storybook 等のツール層でやむを得ず `any` を使用する場合は、ESLint の無効化と理由のコメント（Tooling limitations）を必須としました。

3. **SRI 標準の sha384 統一**:
   - 外部バイナリの整合性チェックに使用する SRI ハッシュのプレースホルダーを `sha256` から現代のブラウザ標準である `sha384` 形式へ統一しました。
   - 本番デプロイ前に実際のハッシュ値への置換が必要な箇所に `TODO` を付与し、CI での検知を可能にしました。

4. **USI 探索停止ロジックの非決定性の解消**:
   - 探索停止時 (`bestmove none`) のパース結果が、エンジンの停止シグナルと矛盾しないよう、`null` を含む明確な結果型として定義し、探索のハングアップケースを完全に排除しました。

## 結末 (Consequences)

- **メリット**:
  - プロジェクト全体の型安全性が Zenith Tier の定義する最高水準に到達。
  - セキュリティ監査（SRI）および環境整合性（TS Config）における負債の解消。
  - Vue と React 間のプロパティ受け渡しの不一致が物理的に解消され、マルチフレームワーク環境での信頼性が向上。
- **デメリット**:
  - `exactOptionalPropertyTypes` の影響により、コンポーネントの props 定義が多少冗長になる。
