# 2026-10-24 セキュリティ保守

## 対象と確認

main `2d9ffbc`の隔離チェックアウトで、pnpm監査26件（critical 3、high 8、moderate 11、low 4）を確認した。GitHub通知のmarkdown-it以外にNext.js、Storybook、Nuxt、Happy DOM、Undiciなどが含まれた。

- Next.js 16.4.3、Nuxt 4.6.2、Storybook本体10.6.3へ互換更新。
- jsdom 30.1.3、Happy DOM 21.0.4、Wrangler 4.152.0と対応workers-typesへ更新。
- Nuxt更新でVue 3.5.43/3.5.44の型が二重になったため、全workspaceのVueとcompiler-domを3.5.44へ統一。型検査の抑制は追加しない。
- markdown-it 14.3.3、launch-editor 2.14.2、fast-uri 3.1.9、Zod、Undici、serialize-javascriptの安全な版をlockfileで解決。
- Storybook本体10.6.3はFireObjectをtesting-libraryの公開exportから読むため、旧events.jsパッチを削除。
- Nuxt DevTools 3.4.4はsimple-gitをtinyexecへ置換済み。不要な旧互換パッチを削除。
- Nitro 2.13.5は依然archiverの旧default APIを使用するため、既存のZipArchive互換パッチを移植。

## Vue型宣言の互換修正

Vueを揃えた後、Storybookを含むui-vue-monitorの型検査でVue 3.5.44の`ExtractDefaultPropTypes`がTS2313を発生させた。`keyof Pick<O, DefaultKeys<O>>`を`keyof O`を走査し`DefaultKeys<O>`へキーを絞るmapped typeへ置き換える1行パッチを適用。readonlyとoptional修飾子を保持する。InferPropType・公開API・チェック強度は変更しない。独立レビューで通常のruntime prop-optionsオブジェクトについて型の同等性を確認し、失敗していた対象の型検査が成功した。readonly tupleを型引数にした場合、旧宣言が作る実在しない長さ位置のキーは新宣言では除外される。配列形式のpropsにはdefault指定がないため、オブジェクト形式のdefaults推論を検証対象とする。上流で同等の宣言修正が入り、パッチなしで全型検査が通れば削除する。

## 必要な依存例外

最新Wrangler 4.152.0が使用するMiniflare `5.20261019.2-beta`はUndici `7.29.1`を厳密指定する。公開レジストリのdependenciesで確認した。このため脆弱な7系列だけへ`undici@>=7.18.0 <7.30.1: >=7.30.1 <8`を適用する。監査除外や固定版ではない。Miniflareの指定が安全な版へ変わり、overrideなしのfrozen install・監査・Cloudflare型検査が成功したら削除する。他の推移依存には永続overrideを追加しない。

## 検証

- `pnpm install --frozen-lockfile`: 成功。strict peerチェックと既存ビルド許可を維持。
- `pnpm audit`: 0件（開発依存を含む）。
- `pnpm lint`: 成功（警告拒否を維持）。
- `pnpm exec turbo typecheck --force`: 99タスク成功、キャッシュ0件。
- `pnpm build`: 56タスク成功。
- `pnpm test`: 全workspaceとtooling 13試験成功。
- `pnpm --filter @multi-game-engines/core test:coverage`: 成功、行98.47%。
- CodeRabbit: 2回確認。初回の記録リンク2件は修正。2回目のlockfile整合指摘はfrozen installとCIで検証する。Vue最終パッチは独立レビューとreadonly・値型の実コンパイラ回帰試験で確認。
- `pnpm doc-sync`、`git diff --check`: 成功。PR #285のリモートE2E4種類・ESLint・CodeQL・benchmarksは成功。CIのbuild・lint・typecheck・test・core coverage・doc-syncも成功し、最終OSV監査だけが下記の上流データ矛盾で失敗。

## リモートOSVの外部ブロッカー

[CI 40097166449](https://github.com/hdkz-dev/multi-game-engines/actions/runs/40097166449)のOSV Scanner 2.6.0は、Nuxtと@nuxt/nitro-serverの4.6.2に対しGHSA-vjh5-4x84-xrqpを検出し、修正版欄にも4.6.2を表示した。[GitHub公式アドバイザリ](https://github.com/advisories/GHSA-vjh5-4x84-xrqp)は4系列を`<4.6.2`、3系列を`<4.0.0`と明示する。一方[OSVデータ](https://api.osv.dev/v1/vulns/GHSA-vjh5-4x84-xrqp)は3系列の上限をdatabase_specific.last_known_affected_version_rangeだけに保存し、rangesのintroduced3.0.0/3.20.0には上限イベントがない。

`api.osv.dev/v1/query`へnuxt4.6.2を直接問い合わせても同じ通知が返ることを確認した。クライアント更新だけでは直らない上流の判定データ不整合であり、修正版を未適用という結果ではない。監査除外・成功扱い・検査削除は行わない。上流報告原稿を準備したが、外部への投稿は未実施。mainは承認レビュー1件を必須としており、マージ・npm公開は未実施。

公開APIや通信境界の変更はない。main統合・npm公開は未実施。別途M1b/M1cの残課題は継続する。
