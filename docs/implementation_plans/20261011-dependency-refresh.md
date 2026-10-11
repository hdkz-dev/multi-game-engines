# 依存最新化記録 (2026-10-11)

2026-10-11、最新main `8f91525`を基点に使用中の直接依存を再調査し、17種類を最新互換版へ更新。Next 16.4.0のglob修正パッチを移植し、Node型26.6.5はNode 24で検証する。TypeScript 7はtypescript-eslint/TypeDocのpeer範囲外、Unicorn 77は試行で公開boolean名・クラス構造に波及する新規則を確認したため別移行として残す。新たな固定・ignore・規則抑制は追加しない。詳細は [依存最新化記録](20261011-dependency-refresh.md) を参照。PR #273の監視UI2件はnpm公開・integrity照合まで完了済み。M1b/M1cは別の残課題。

| Package                     | Before        | Adopted       |
| --------------------------- | ------------- | ------------- |
| @cloudflare/workers-types   | ^5.20261009.1 | ^5.20261011.1 |
| @eslint-react/eslint-plugin | ^5.24.10      | ^5.26.0       |
| @lucide/vue                 | ^1.52.0       | ^1.55.0       |
| @next/eslint-plugin-next    | ^16.3.8       | ^16.4.0       |
| @playwright/test            | ^1.63.0       | ^1.64.0       |
| @swc/core                   | ^1.16.13      | ^1.16.18      |
| @types/node                 | ^25.9.7       | ^26.6.5       |
| @vitejs/plugin-vue          | ^6.0.9        | ^6.0.10       |
| happy-dom                   | ^20.14.5      | ^20.14.6      |
| lucide-react                | ^1.52.0       | ^1.55.0       |
| next                        | ^16.3.8       | ^16.4.0       |
| nuxt                        | ^4.6.0        | ^4.6.1        |
| prettier                    | ^3.9.9        | ^3.9.10       |
| stockfish                   | ^19.0.0       | ^19.0.1       |
| vite                        | ^8.3.2        | ^8.3.4        |
| vue-tsc                     | ^3.3.12       | ^3.3.13       |
| wrangler                    | ^4.147.0      | ^4.149.0      |

## Compatibility

TypeScriptは6.0.3、Unicornは64.0.0を維持する。Unicorn 77のrecommended設定APIへ切替えて検査・自動修正を試行したが、consistent-boolean-name・consistent-class-member-order・no-break-in-nested-loop等が利用者向けAPI/実装構造の広範な変更を要求する。試行変更は取り消し、既存検査を維持する。これは最新化完了ではなく別の設計移行課題である。Node型のメジャー更新は実行環境の変更を意味しない。新しいNode APIは導入せず、CIのNode 24を維持する。

Latest peer evidence: typescript-eslint `>=4.8.4 <6.1.0`; TypeDoc supports through `6.0.x`. [TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) and [Unicorn recommended configuration](https://github.com/sindresorhus/eslint-plugin-unicorn#preset-configs).

## Validation

Strict peer install and patched Next directory-discovery regressions (8 tests) passed. Full lint/typecheck/build/test, npm audit and TypeDoc warnings gate are required before commit. Browser regressions run through the existing four CI E2E jobs using Portless named URLs for dashboards.
