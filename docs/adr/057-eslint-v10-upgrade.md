# ADR-057: ESLint v10 への即時アップグレードと Peer Dependency 警告の抑制 (Immediate ESLint v10 Upgrade and Peer Dependency Suppression)

## ステータス

- **対象フェーズ**: 開発環境・静的解析
- **ステータス**: Accepted
- **日付**: 2026-03-04
- **Supersedes**: ADR-044

## 背景と課題

ADR-044 で、プロジェクトは「エコシステムが完全に成熟するまで ESLint v9 にピン留めする」という方針を取っていました。特に `eslint-config-next` および `eslint-plugin-react` が v10 で削除された `context.getFilename()` API を呼び出しておりクラッシュすることが最大のブロッカーでした。

しかし、ADR-056 によって `eslint-config-next` を脱却し、同時に TypeScript/React 19 ネイティブで高速な `@eslint-react/eslint-plugin` へ完全に移行したことで、v10 アップグレードに対する直接的なクラッシュ要因（ブロッカー）は全て解消されました。

唯一の懸念点として、`eslint-plugin-react-hooks@7.0.0` などの一部のプラグインが、公式には `peerDependencies` で `eslint: ^9.0.0` までしか宣言していないため、インストール時に警告が発生する問題が残されていました（Flat Config 自体への対応は済んでおり動作は正常です）。

## 決定事項

1. **ESLint v10 への即時移行**: 動作上のブロッカーが無くなったため、パフォーマンス向上と最新機能の恩恵を受けるべく、ESLint v10（`eslint@next`）へ即時（Early Adopterとして）アップグレードする。
2. **Peer Dependency 警告の許容と抑止**: `package.json` の `pnpm.peerDependencyRules.allowAny` に `eslint` を追加し、プラグイン側の `peerDependencies` バージョン不整合警告を意図的にサイレントにする。（プラグイン側の公式対応が追いつくまでの過渡的な措置とする）
3. **新規ルールの遵守**: ESLint v10 で新規追加された `no-useless-assignment` などの新たな検査ルールに従い、コードベースをクリーンに保つ。

## トレードオフ

- **メリット**:
  - プロジェクトが常に最新の静的解析基盤（v10 + Flat Config）で動作し、パフォーマンスと機能の恩恵をいち早く受けられる。
  - ADR-044 のような「アップグレードの制約」を早期に外すことができる。
- **デメリット**:
  - コミュニティのエコシステム（`eslint-plugin-react-hooks` のマニフェストなど）が完全に v10 を明示サポートするまでの間、`pnpm` のルールレイヤーで警告を握りつぶす変則的な設定が必要になる。

## 実装

- ワークスペースの `eslint` バージョンを `v10` 系（`next` または `rc`）に固定。
- `package.json` にて `pnpm.peerDependencyRules.allowAny: ["eslint"]` を設定。
- `@multi-game-engines/core` などに潜在していた `no-useless-assignment` エラー等を修正し、CI を通過させる。
