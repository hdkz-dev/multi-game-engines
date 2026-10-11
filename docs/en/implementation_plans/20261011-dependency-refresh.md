# Dependency refresh record (2026-10-11)

On 2026-10-11, rechecked used direct dependencies from latest main `8f91525` and updated 17 packages to current compatible releases. Ported the Next 16.4.0 glob patch; Node types 26.6.5 are verified on Node 24. TypeScript 7 is outside typescript-eslint/TypeDoc peer support. The Unicorn 77 trial exposed new rules affecting public boolean names and class structure, so its migration remains separate. No new pins, ignore rules or rule suppressions are added. See the [dependency refresh record](20261011-dependency-refresh.md). Both PR #273 monitor releases have been verified in npm with integrity metadata. M1b/M1c remain separate open work.

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

Keep TypeScript 6.0.3 and Unicorn 64.0.0. Tried Unicorn 77 recommended configuration and autofix. Rules such as consistent-boolean-name, consistent-class-member-order and no-break-in-nested-loop require broad public-API or implementation restructuring. Reverted the trial and retained existing checks. This migration remains incomplete as a separate design task. Updating Node types does not change the runtime; introduce no new Node APIs and retain Node 24 CI.

Latest peer evidence: typescript-eslint `>=4.8.4 <6.1.0`; TypeDoc supports through `6.0.x`. [TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) and [Unicorn recommended configuration](https://github.com/sindresorhus/eslint-plugin-unicorn#preset-configs).

## Validation

Strict peer install and patched Next directory-discovery regressions (8 tests) passed. Full lint/typecheck/build/test, npm audit and TypeDoc warnings gate are required before commit. Browser regressions run through the existing four CI E2E jobs using Portless named URLs for dashboards.
