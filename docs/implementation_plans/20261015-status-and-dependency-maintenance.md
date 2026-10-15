# 2026-10-15 status and dependency maintenance

main `56d8932`とリモートmainは一致。PR #274の17種類の更新とPR #275の4パッケージ公開は完了し、npmの対象版・integrityを再確認した。mainの未解決CodeQL・Dependabot警告は0件。新規PRは#276（Unicorn、CI失敗）、#277（通常依存更新）、#278（Happy DOM 21、元CI成功）。#277にHappy DOM 21とZod 4.6.7をまとめ、6種類を検証する。#278は#277統合確認後に重複整理する。TypeScript 7・Unicorn 78・tsup 9の移行と他の最新候補は別途評価する。M1b/M1cは未完了。

## Adopted candidates

| Package                     | Before        | Candidate     |
| --------------------------- | ------------- | ------------- |
| @cloudflare/workers-types   | ^5.20261011.1 | ^5.20261012.1 |
| @radix-ui/react-scroll-area | ^1.3.0        | ^1.4.0        |
| @radix-ui/react-separator   | ^1.1.16       | ^1.2.0        |
| @radix-ui/react-slot        | ^1.4.0        | ^1.5.0        |
| happy-dom                   | ^20.14.6      | ^21.0.1       |
| zod                         | ^4.6.5        | ^4.6.7        |

## Compatibility and validation

Happy DOM 21 disables external CSS/iframe loading by default; keep the defaults and do not introduce opt-ins. [Official release](https://github.com/capricorn86/happy-dom/releases/tag/v21.0.0). All existing Vue unit tests and four CI E2E suites must pass. Retain strict peers, warning gates, existing patches and bounded security overrides. Add patch changesets for runtime Zod/Radix changes. Normalize generated lockfile formatting without changing resolution semantics.

## Remaining candidates

Snapshot only; not an adoption list. Check upstream peers, runtime requirements and installed patches per package. TS7/Unicorn/tsup majors need explicit compatibility investigation; do not infer successful migration from the original dependency-only PR.

| Package                        | current      | latest       |
| ------------------------------ | ------------ | ------------ |
| @next/eslint-plugin-next       | 16.4.0       | 16.4.1       |
| @playwright/test               | 1.64.0       | 1.64.1       |
| @storybook/addon-a11y          | 10.6.1       | 10.6.2       |
| @storybook/addon-docs          | 10.6.1       | 10.6.2       |
| @storybook/addon-links         | 10.6.1       | 10.6.2       |
| @storybook/react               | 10.6.1       | 10.6.2       |
| @storybook/react-vite          | 10.6.1       | 10.6.2       |
| @storybook/vue3                | 10.6.1       | 10.6.2       |
| @storybook/vue3-vite           | 10.6.1       | 10.6.2       |
| @storybook/web-components      | 10.6.1       | 10.6.2       |
| @storybook/web-components-vite | 10.6.1       | 10.6.2       |
| @testing-library/user-event    | 14.6.7       | 14.6.8       |
| @typescript-eslint/parser      | 8.71.1       | 8.71.2       |
| @vitest/coverage-v8            | 5.0.3        | 5.0.4        |
| @vitest/expect                 | 5.0.3        | 5.0.4        |
| @vue/compiler-dom              | 3.5.43       | 3.5.44       |
| eslint-plugin-prettier         | 5.5.6        | 5.5.7        |
| eslint-plugin-storybook        | 10.6.1       | 10.6.2       |
| jsdom                          | 30.1.2       | 30.1.3       |
| next                           | 16.4.0       | 16.4.1       |
| postcss                        | 8.5.29       | 8.5.30       |
| react                          | 19.3.0       | 19.3.1       |
| react-dom                      | 19.3.0       | 19.3.1       |
| storybook                      | 10.6.1       | 10.6.2       |
| turbo                          | 2.11.7       | 2.11.8       |
| typescript-eslint              | 8.71.1       | 8.71.2       |
| vitest                         | 5.0.3        | 5.0.4        |
| vue                            | 3.5.43       | 3.5.44       |
| @cloudflare/workers-types      | 5.20261012.1 | 5.20261015.1 |
| @eslint-react/eslint-plugin    | 5.26.0       | 5.27.1       |
| @lucide/vue                    | 1.55.0       | 1.57.0       |
| lucide-react                   | 1.55.0       | 1.57.0       |
| oxlint                         | 1.87.0       | 1.88.0       |
| wrangler                       | 4.149.0      | 4.151.0      |
| eslint-plugin-unicorn          | 64.0.0       | 78.0.0       |
| tsup                           | 8.5.1        | 9.0.0        |
| typescript                     | 6.0.3        | 7.0.2        |
| portless                       | 0.15.7       | 0.15.8       |

## Sequence

1. Validate consolidated #277 locally and in CI; review the committed diff.
2. Merge using a merge commit after required approval; verify post-merge checks.
3. Close duplicate #278 after confirming its changes are integrated.
4. Inspect generated release versions and validate publication candidates separately.
5. Address remaining dependency candidates in bounded groups; keep M1b/M1c implementation work visible.
