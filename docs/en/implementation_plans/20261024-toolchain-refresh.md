# 2026-10-24 development dependency and toolchain refresh

## Inspection

- Main: `2d9ffbc`, identical locally and on origin. Two existing personal configuration edits are outside this change.
- Open PRs: #276 (Unicorn), #280 (release proposal), #283 (routine dependencies), #284 (OSV Scanner).
- Zero open CodeQL alerts; one High and one Low markdown-it Dependabot alert. No running or queued Actions.
- After the markdown-it/launch-editor update, pnpm audit still reported 21 findings. The completed dependency update reports zero.

## Updates

Update 43 direct dependency families. Key versions: Next 16.4.3, React 19.3.1, Vue 3.5.44, Nuxt 4.6.2, Storybook 10.6.3, Vite 8.3.5, Vitest 5.0.5, ESLint 10.13.0, typescript-eslint 8.72.0, tsup 9.0.0, Turbo 2.11.10, Wrangler 4.152.0 and Playwright 1.64.1.

Migrate to pnpm 12.15.0 and consolidate settings in pnpm-workspace.yaml. Convert the same approved build packages to allowBuilds. Retain strictPeerDependencies and skipLibCheck: false. Select the latest releases older than 24 hours: Workers types 5.20261023.1, ESLint React 5.28.7 and Portless 0.15.9. Add no minimumReleaseAgeExclude, audit exclusions or lint suppressions.

Update transitive markdown-it to 14.3.3 and launch-editor to at least 2.14.2. Restrict compatible security lower bounds for zod, undici, serialize-javascript and fast-uri to vulnerable ranges. Reevaluate removal when upstream consumers permit and resolve safe releases.

Remove obsolete Storybook core, tsup and Nuxt DevTools patches. Port required framework declaration, Next and Nitropack patches. Add patch changesets for the two monitor UI packages whose published dependencies change. The React lint preset is already ignored by Changesets and is not included in the release plan.

## Remaining migrations

- TypeScript 7.0.2: typescript-eslint 8.72.0 requires `<6.1.0`; TypeDoc 0.28.20 supports through 6.0.x. Retain 6.0.3.
- Unicorn 79 is less than 24 hours old. Mature release 78 still produces 644 core findings involving boolean names, class order, promises and comments. Retain 64 and treat public API/runtime changes as a separate migration. Renaming the recommended preset alone is insufficient.
- Merging/publishing #280 and M1b/M1c remain incomplete.

## Validation

Passed: pnpm 12 frozen installation with publication-age verification; lint 98/98 including Oxlint and tooling ESLint; typecheck 99/99; build 56/56; 148 Vitest files with 1,697 tests and 12 tooling tests. Both full and production pnpm audits report zero findings. TypeDoc with warnings treated as errors, document synchronization, Changesets status and formatting checks also passed. CodeRabbit CLI raised one lockfile consistency finding, already verified by the successful pnpm 12 frozen install. GitHub Codex review completed without findings. See the following update for remote validation results.

## Waiting for the upstream OSV correction (2026-10-25)

Implementation commit `2ea32d5` in maintenance PR [#286](https://github.com/hdkz-dev/multi-game-engines/pull/286) passed CI build, lint, typecheck, tests, core coverage and document synchronization, all four E2E lanes, ESLint, CodeQL and benchmarks. Full and production pnpm audits report zero findings. However, the OSV audit fails because the Nuxt 3 ranges in GHSA-vjh5-4x84-xrqp lack an upper bound and incorrectly match the fixed nuxt / @nuxt/nitro-server 4.6.2 releases. Overall auditing has not passed.

Independently validated the existing upstream PR [github/advisory-database#10504](https://github.com/github/advisory-database/pull/10504) against all 277 published stable Nuxt versions and 32 published stable @nuxt/nitro-server versions; membership matches the maintainer's affected ranges. [Added downstream CI reproduction evidence](https://github.com/github/advisory-database/pull/10504#issuecomment-6385792027). The upstream PR is still open and OSV has not incorporated the correction. Rerun CI after confirming propagation. No audit exclusions have been added.

## Development Node LTS update (2026-10-25)

Update `.node-version` and `.nvmrc` from 24.13.0 to the Node 24 LTS security release 24.22.1. Verify the [official release index](https://nodejs.org/dist/index.json) and distribution SHA-256, then run the quality gates with Node 24.22.1. CI continues to select the Node 24 line. Public APIs and published package compatibility ranges are unchanged. The upstream OSV audit blocker remains a separate unmet condition.

With Node 24.22.1 and caching disabled, lint 98/98, typecheck 99/99 and build 56/56 passed. Also passed: 148 Vitest files / 1,697 tests, 12 tooling tests, TypeDoc with warnings as errors, document synchronization and frozen installation. The existing OSV data defect remains unresolved.

## Post-merge verification (2026-10-25)

Maintenance PR [#286](https://github.com/hdkz-dev/multi-game-engines/pull/286) merged into main at 2026-10-25 01:20 JST with merge commit `db25265`. The OSV data defect remains unresolved; post-merge CI, E2E and Release runs are being checked. The Node 24.22.1 version-file update was not included in that merge, so validate it as a separate change based on current main. Zero pnpm audit findings do not mean that OSV auditing or publication has completed.

## Preserve the unique PR #285 regression test (2026-10-25)

Retain the Vue default-prop inference test from duplicate candidate PR #285. With TypeScript 6.0.3 and Vue 3.5.44, only the intentional readonly assignment and invalid boolean assignment are rejected. The test passes without an additional Vue runtime-core patch, bringing tooling coverage to 13 tests. Generated versions for all 45 bumped public packages match PR #280; the isolated release candidate also passed uncached lint 98/98, typecheck 99/99, build 56/56 and 1,697 Vitest cases.

## Latest verification addendum (2026-10-25)

PR #286, release PR #280 and follow-up PR #287 have merged into main (`aca79a5` at inspection). Exact versions and dist.integrity were verified for all 53 public npm packages, including the 45 updated releases. GitHub reports zero open Dependabot and CodeQL alerts. OSV still incorrectly matches fixed Nuxt 4.6.2 through GHSA-vjh5-4x84-xrqp; upstream PR #10504 remains pending. PR #287 integrated Node 24.22.1, Release commit ownership and the unique PR #285 regression test. This separate update adopts the now-mature ESLint React 5.28.8, Portless 0.15.11 and Workers types 5.20261024.1 updates. With Node 24.22.1, uncached lint 98/98, typecheck 99/99, build 56/56, 1,697 Vitest cases and 13 tooling tests passed. These dependency changes affect development tooling or private packages and require no further npm publication.
