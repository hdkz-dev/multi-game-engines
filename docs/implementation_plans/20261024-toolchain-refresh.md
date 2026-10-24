# 2026-10-24 開発依存・ツール更新

## 確認時点

- main: `2d9ffbc`（ローカルとorigin一致）。既存の個人設定2ファイルは変更対象外。
- 未完了PR: #276（Unicorn）、#280（公開候補）、#283（通常依存）、#284（OSV Scanner）。
- CodeQL未解決0件、Dependabotはmarkdown-itのHigh/Low各1件。実行中・待機中Actionsは0件。
- markdown-it/launch-editor更新後のpnpm auditでも21件が残った。更新後は0件。

## 更新

43種類の直接依存を更新。主な採用版はNext 16.4.3、React 19.3.1、Vue 3.5.44、Nuxt 4.6.2、Storybook 10.6.3、Vite 8.3.5、Vitest 5.0.5、ESLint 10.13.0、typescript-eslint 8.72.0、tsup 9.0.0、Turbo 2.11.10、Wrangler 4.152.0、Playwright 1.64.1。

pnpm 12.15.0へ移行し、設定をpnpm-workspace.yamlに集約。ビルド許可対象は変更せずallowBuildsへ変換。strictPeerDependenciesとskipLibCheck: falseを維持する。公開後24時間を経過した最新版としてWorkers型5.20261023.1、ESLint React 5.28.7、Portless 0.15.9を採用。minimumReleaseAgeExclude・audit除外・新たなlint抑制は追加しない。

間接依存はmarkdown-it 14.3.3とlaunch-editor 2.14.2以上へ更新。zod、undici、serialize-javascript、fast-uriは脆弱範囲だけに互換版の安全下限を設定した。依存元が安全版を許可・解決するようになったらこの下限の撤去を再評価する。

Storybook本体・tsup・Nuxt DevToolsの不要パッチを撤去。Storybook各フレームワーク、Next、Nitropackの必要なパッチは新版へ移植した。監視UI2パッケージにはpatch changesetを付与した。React lint設定はChangesetsの既存ignore対象であり、公開対象には含めない。

## 残る移行

- TypeScript 7.0.2: typescript-eslint 8.72.0は `<6.1.0`、TypeDoc 0.28.20は6.0.xまで。6.0.3を維持。
- Unicorn 79: 公開後24時間未満。保護期間を経た78でもcore単体644件（boolean命名、クラス順序、Promise、コメント等）。公開API・実行環境契約を伴う別移行とし、64を維持。推奨設定の新しい名前だけへの変更では不十分だった。
- #280のマージ・npm公開、M1b/M1cは完了していない。

## 検証

pnpm 12の公開時刻検査を含むfrozen install、lint 98/98（Oxlint・tooling ESLintを含む）、typecheck 99/99、build 56/56、Vitest 148ファイル・1,697テストとtooling 12テストが成功。全依存・本番依存のpnpm auditは0件。TypeDocの警告エラー化検査、文書同期、Changesets status、整形検査も成功。CodeRabbit CLIはlockfile整合性の指摘1件（pnpm 12のfrozen install成功で確認済み）。GitHub Codexレビューは指摘なし。リモート検証の結果は次の追記を参照。

## OSV監査の上流修正待ち (2026-10-25)

保守PR [#286](https://github.com/hdkz-dev/multi-game-engines/pull/286) の実装コミット `2ea32d5` は、CIのbuild・lint・typecheck・test・core coverage・文書同期、E2E全4系統、ESLint・CodeQL・ベンチマークを通過した。pnpm audit（全依存・本番依存）は0件。一方、OSV監査はGHSA-vjh5-4x84-xrqpのNuxt 3向け範囲に上限がないため、修正済みのnuxt / @nuxt/nitro-server 4.6.2を誤検出して失敗している。監査全体の成功とは扱わない。

既存の上流修正PR [github/advisory-database#10504](https://github.com/github/advisory-database/pull/10504) を独立検証し、公開済み安定版Nuxt 277版・@nuxt/nitro-server 32版で公式の影響範囲との一致を確認した。[下流CIの再現情報を追記済み](https://github.com/github/advisory-database/pull/10504#issuecomment-6385792027)。現時点では上流未統合・OSV未反映。反映を確認してからCIを再実行する。監査除外・強制統合は行っていない。
