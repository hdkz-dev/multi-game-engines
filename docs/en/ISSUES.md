# Issue register (2026-10-07)

## Resumption status (2026-10-09)

M1a transport validation and Q1 public-API type-safe tests are merged in PR #269; main has zero open CodeQL and Dependabot alerts. PR #270 merged on 2026-10-09 (7391dbb); Release publication of 45 packages including core 0.2.2 is being verified. PR #272 failed on Unicorn 77 configuration compatibility. Preserve Unicorn 64 and Node 25 types per ADR 061 while validating minor/patch updates; Node types resolve to 25.9.9. Separate major updates from the routine Dependabot group for individual review without adding ignore rules. M1b mandatory SRI/cache integrity and M1c response-size contracts remain open.

## Transport boundary remediation (2026-10-07)

PR #268 dependency fixes are merged on main `2b6b534`; audit reports zero findings and post-merge CI, E2E, Release, docs deployment and SRI refresh passed. This change implements M1a pending integration: validate URLs before cache access; use safeFetch with credentials omit and redirect error for HEAD, Range and GET. Invalid URLs, embedded credentials and remote HTTP raise SECURITY_ERROR. HEAD security refusals and aborts do not fall back. Confirm closure of CodeQL 68–70 after integration. M1b mandatory SRI, M1c response-size contracts remain incomplete. Q1 public-API tests remove any and suppression, pending integration. This change also includes Dependabot PR #267 action-download-artifact v27.

## Historical audit: October 7 11:51 JST, main 3febeb0

At 11:51 JST, main was `3febeb0` with no open PRs or running/queued Actions. Last main CI passed, but the new pnpm audit fails with one Critical and one High finding. Previous CI success is not current audit success. GitHub Dependabot still reports zero, reflecting a data/timing difference.

| ID  | Priority / status  | Dependency path and evidence                                                                      | Fix and acceptance                                                                                                               |
| --- | ------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Complete / PR #268 | shell-quote 1.10.0, root→@changesets/cli→launch-editor; Critical quote command injection          | Resolve >=1.11.0, preferably through parent ranges; remove vulnerable lockfile path, verify release tooling and all gates/audits |
| S2  | Complete / PR #268 | sharp 0.35.4, React Dashboard→next→sharp and Wrangler→Miniflare→sharp; High librsvg vulnerability | Resolve >=0.35.5; validate Next build/relevant image behavior, patches/runtime if Next changes, all gates/audits                 |

[S1 advisory](https://github.com/advisories/GHSA-pqg4-j6r4-53mv) / [S2 advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). These identify vulnerable dependency versions, not demonstrated exploitation in this project. Three High CodeQL findings belong to a separate analysis; track them separately.

Order: **S1/S2 → M1a/M1b plus M1c/Q1 → M2 → M3a → prerequisite-ready M4–M7**. S1/S2 may share a security dependency PR, without unrelated major migrations. S1/S2 are merged in PR #268: shell-quote 1.11.0 and sharp 0.35.5. Both Next and Wrangler→Miniflare paths resolve securely through the vulnerable-range-only override `sharp@<0.35.5: >=0.35.5 <0.36`. Branch pnpm audit reports zero findings; lint, typecheck, build, test, Changesets status, sharp SVG-to-PNG conversion and Wrangler startup passed. Three High CodeQL alerts and other issues remain open.

## Baseline and classification

Rechecked on 2026-10-07 at 11:51 JST against main `3febeb0`. PR #266 is merged; post-merge validation, Release, Pages, and SRI workflows succeeded. This change also implements S1/S2 dependency fixes. M1 onward and credential rotation remain incomplete.

Confirmed findings have code/configuration/API evidence. Investigation items are not claimed as demonstrated vulnerabilities. Deferred work needs upstream compatibility or external prerequisites. Completion requires the stated acceptance criteria, not merely successful CI.

| ID  | Class / priority                      | Evidence and impact                                                                                          | Next action / completion criteria                                                                                         |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| M1a | Implemented, integration pending / P0 | Latest-main CodeQL High alerts 68–70; Branch implements URL validation before cache and safeFetch throughout | Define HTTPS, URL credentials, local-development and redirect policy; regression tests, gates, alert resolution           |
| M1b | Confirmed / P0                        | Public download API makes SRI optional and full verification conditional                                     | Reconcile mandatory-SRI policy with public contract and migration; preserve cache and segmented integrity                 |
| M1c | Investigation / P1                    | HEAD fallback, Range accepts 200, offsets advance by returned bytes                                          | Test cancellation, empty chunks, invalid lengths, mismatched/oversized responses and redirects; fix demonstrated failures |
| Q1  | Confirmed / P1                        | EngineLoader.security.test.ts:23 uses `as any`                                                               | Replace with type-safe or public-contract testing while retaining security coverage                                       |
| M2  | Confirmed / P1                        | Outdated JSON contains 18 distinct packages: fifteen routine updates, three majors                           | Check release age/peers/runtime; gates, E2E, zero npm/OSV findings; explain deferrals                                     |
| M3a | Investigation / P1                    | NPM_TOKEN exists, updated July 31; current expiry/write permissions unknown                                  | Verify privately before actual publishing; workflow success with no packages does not prove write access                  |
| M3b | Complete / P1                         | PR #266 aligned 24 documents and bilingual plans                                                             | Continue register/link maintenance; operational M3a remains incomplete                                                    |
| M4  | Deferred / P2                         | Installed typescript-eslint supports TS <6.1; TypeDoc through 6.0.x                                          | Verify official upstream TS7 support, then declarations, API docs and gates                                               |
| M5  | Deferred / P2                         | Unicorn 64 vs latest 77; ES2022 target                                                                       | Investigate rules/APIs/runtime and fix violations without suppression                                                     |
| M6  | Deferred / P2                         | Node types 25.9.7 vs 26.6.4; CI uses Node 24                                                                 | Decide runtime support before type migration; validate aligned environments                                               |
| M7  | Deferred / P2                         | Root configuration has 15 patches, 10 overrides and a readPackage hook                                       | Retire per upstream fix; frozen install, regressions and zero audits after removal                                        |

Q1 identifies one confirmed occurrence, not a completed repository-wide any audit. M1c is a source-derived investigation list, not additional confirmed security alerts.

## Download boundary and decisions

ChunkedDownloader is exported publicly and used by EngineLoader. EngineLoader validates initial resource URLs before loading; direct users do not inherit that validation. Resources at least 32 MiB with SRI delegate to ChunkedDownloader. Initial URL safety and redirect-destination safety must be verified separately.

Review HEAD, Range and single-fetch paths in `packages/core/src/storage/ChunkedDownloader.ts`; alerts [68](https://github.com/hdkz-dev/multi-game-engines/security/code-scanning/68), [69](https://github.com/hdkz-dev/multi-game-engines/security/code-scanning/69), [70](https://github.com/hdkz-dev/multi-game-engines/security/code-scanning/70).

Record HTTPS, loopback/Portless, URL credentials, redirects, missing SRI, incomplete segment hashes, and cache revalidation decisions in an ADR. Test normal HTTPS, rejection before fetch, tampering, Range contracts, cancellation, progress and cache. Dismissal or diagnostic suppression is not completion.

## Future capabilities and prerequisites

| ID                | Current implementation                                                 | Prerequisite and acceptance                                                                             |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| F1 KataGo         | Stub ONNX with registered SRI; real-model URL secret absent            | Model/licence/tensor contract/distribution; actual inference and deployment verification                |
| F2 Mortal         | Rule-based Worker stub                                                 | Model conversion and inference Worker; real-model tests, SRI and deployment                             |
| F3 CDN            | Cloudflare configuration/Worker code; production deployment unverified | Account/R2/domain/cost/CORS/recovery; validate delivery and rollback                                    |
| F4a Acceleration  | Hardware diagnostics and OTel available                                | Workload/device/performance goals; actual offload, fallback and measurement                             |
| F4b Mobile        | Native communicator foundation differs from mobile product integration | React Native/Capacitor and NDK/iOS requirements; device/lifecycle/distribution tests                    |
| F5 Expert mapping | MajorityVote, BestScore and fixed Weighted strategies/tests            | Phase classification, expert mapping and deterministic evaluation; dynamic weights and regression tests |

## Order and constraints

Resolve S1/S2 first, then define M1a/M1b and reproduce M1c; address Q1 in the related security-test scope. Then M2. M3a is a prerequisite for actual publication. M4–M7 use separate PRs as prerequisites become available; future capabilities need separate plans.

Preserve unrelated local settings. Do not remove all patches together. This investigation verified installed peer ranges, not complete compatibility of all upstream latest releases. Recheck package versions before implementation.

[Execution plan](implementation_plans/20261006-maintenance-and-roadmap.md) / [Progress](PROGRESS.md) / [Japanese register](../ISSUES.md)

## M1 / Q1 verification matrix

Existing ChunkedDownloader tests cover cache, valid Range, progress, fallback, successful/mismatched SRI, HTTP errors, storage, failed HEAD and segmented verification. Additional checks below are planned, not completed verification.

| Boundary              | Evidence                                                    | Additional checks / acceptance                                                                                 |
| --------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Direct API / Loader   | Public export and EngineLoader delegation                   | Consistent policy; reject before any fetch including HEAD                                                      |
| URLs / redirects      | Validate before cache; safeFetch with omit/error throughout | Specify loopback/Portless, credentials, HTTPS-to-HTTP redirects, relative URLs and protocols                   |
| Integrity             | SRI/segment tests exist                                     | Missing/multiple hashes, insufficient segments, cache revalidation                                             |
| Range                 | Valid chunks and HTTP failures tested                       | 200/206, Content-Range, empty/oversized chunks, total-length mismatch; prevent invalid copying or non-progress |
| Cancellation / limits | Signals and Loader timeouts                                 | Cancellation during HEAD/read/chunk transitions; length limits and invalid chunk sizes                         |
| Cache / progress      | Cache failure fallback, writes and progress tested          | Corrupt cache, failed writes, completed notifications on errors, retry contract                                |
| Errors / types        | DownloadError/EngineError and Q1 any occurrence             | Public-API rejection tests, type safety and compatible errors                                                  |

Use meaningful deterministic tests. Decide whether URL/SRI contract changes need an ADR, migration guide and changeset.

## M7 patch inventory and retirement criteria

| Target / count                          | Current purpose and coupled configuration                 | Removal verification                                           |
| --------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| tsup 8.5.1 / 1                          | Avoid automatic baseUrl in declaration generation         | Declarations and builds pass upstream-only                     |
| rapid-draughts 1.0.6 / 1                | .js extensions in declaration imports                     | NodeNext types and checkers regression                         |
| jest-dom 7.0.1 / 1                      | Vitest Assertion and @vitest/expect augmentation          | Matcher types, UI tests, declaration checks                    |
| nitropack 2.13.4 / 1                    | Archiver 8 ZipArchive API; coupled override               | ZIP creation and Nuxt builds                                   |
| Storybook 10.6.1 / 5                    | CSF constraints, react-vite types, ESM declaration import | Framework declarations, Storybook build, relevant interactions |
| listhen 1.10.1 / 1                      | Replace node-forge with Node crypto/x509; coupled hook    | CJS/ESM HTTPS, CA/SAN, encrypted PEM/PFX, audit                |
| Next ESLint 16.3.8 / 1                  | tinyglobby root discovery; coupled hook                   | Relative/absolute/array roots without overexpansion            |
| fast-glob / globby / Parcel watcher / 3 | Replace micromatch/braces; coupled hooks                  | Glob/ignore/brace bounds, watcher and audit                    |
| Nuxt DevTools 3.4.2 / 1                 | simple-git 4 named export; coupled overrides              | branch/revparse/status, Nuxt startup/build                     |

Total: 15 patches. Ten overrides comprise eight security floors (simple-git, argv-parser, source-map-js, minimatch, ajv, lodash, esbuild, sharp) and two compatibility adjustments (tsdoc utils and Nitro archiver). Verify upstream fixes, actual lockfile paths and unpatched compatibility before removal; revisit lower and upper bounds together.

## Publication and documentation ownership

M3b alignment was completed in PR #266; this register adds detail. M3a must distinguish secret existence, valid authentication, target write permission, publication targets, and post-publication consumption. Check expiry/permissions before deciding whether rotation is needed. Make publication targets, versions and recovery concrete before external writes.

| Information                        | Owning document                   | Refresh trigger                           |
| ---------------------------------- | --------------------------------- | ----------------------------------------- |
| IDs, evidence, impact, acceptance  | Issue register and translation    | Investigation, fixes, upstream changes    |
| Order, prerequisites, PR gates     | Execution plan                    | Before implementation and plan changes    |
| HEAD, CI, PRs, publication, alerts | Progress                          | Timestamped post-merge/publication checks |
| Implemented contracts/design       | Specifications, architecture, ADR | Code changes, bilingual synchronization   |
| Incomplete capabilities            | Roadmap and tasks                 | Acceptance criteria met                   |

Owners and dates are unassigned. Assign after contract decisions, credential checks and external prerequisites. Plan creation is not implementation completion; CI success is not production-model readiness.

## M2 / M4–M6 version inventory

Re-fetched on 2026-10-07: eighteen packages (fifteen routine updates, three major migrations). wanted is a resolution result, not adoption approval. Next/Next ESLint and Nuxt updates require validation of exact-version patches and hooks.

| Package                     | current      | wanted       | latest       | Dependents | Issue |
| --------------------------- | ------------ | ------------ | ------------ | ---------- | ----- |
| @eslint-react/eslint-plugin | 5.24.0       | 5.24.0       | 5.24.8       | 1          | M2    |
| @radix-ui/react-separator   | 1.1.15       | 1.1.15       | 1.1.16       | 1          | M2    |
| @typescript-eslint/parser   | 8.71.0       | 8.71.0       | 8.71.1       | 1          | M2    |
| @vitejs/plugin-react        | 6.1.1        | 6.1.1        | 6.1.2        | 4          | M2    |
| postcss                     | 8.5.28       | 8.5.28       | 8.5.29       | 1          | M2    |
| typescript-eslint           | 8.71.0       | 8.71.0       | 8.71.1       | 2          | M2    |
| vite                        | 8.3.2        | 8.3.2        | 8.3.3        | 9          | M2    |
| @cloudflare/workers-types   | 5.20261004.1 | 5.20261004.1 | 5.20261007.1 | 1          | M2    |
| @next/eslint-plugin-next    | 16.3.8       | 16.3.8       | 16.4.0       | 1          | M2    |
| @radix-ui/react-scroll-area | 1.2.18       | 1.2.18       | 1.3.0        | 1          | M2    |
| @radix-ui/react-slot        | 1.3.3        | 1.3.3        | 1.4.0        | 1          | M2    |
| next                        | 16.3.8       | 16.3.8       | 16.4.0       | 1          | M2    |
| nuxt                        | 4.5.2        | 4.5.2        | 4.6.0        | 1          | M2    |
| oxlint                      | 1.86.0       | 1.86.0       | 1.87.0       | 1          | M2    |
| wrangler                    | 4.147.0      | 4.147.0      | 4.148.0      | 1          | M2    |
| @types/node                 | 25.9.7       | 25.9.7       | 26.6.4       | 14         | M6    |
| eslint-plugin-unicorn       | 64.0.0       | 64.0.0       | 77.0.0       | 1          | M5    |
| typescript                  | 6.0.3        | 6.0.3        | 7.0.2        | 57         | M4    |
