# Current project progress

## Latest verification addendum (2026-10-25)

PR #286, release PR #280 and follow-up PR #287 have merged into main (`aca79a5` at inspection). Exact versions and dist.integrity were verified for all 53 public npm packages, including the 45 updated releases. GitHub reports zero open Dependabot and CodeQL alerts. OSV still incorrectly matches fixed Nuxt 4.6.2 through GHSA-vjh5-4x84-xrqp; upstream PR #10504 remains pending. PR #287 integrated Node 24.22.1, elimination of duplicate Release commits and the unique PR #285 regression test. This separate update adopts the now-mature ESLint React 5.28.8, Portless 0.15.11 and Workers types 5.20261024.1 updates. With Node 24.22.1, uncached lint 98/98, typecheck 99/99, build 56/56, 1,697 Vitest cases and 13 tooling tests passed. These dependency changes affect development tooling or private packages and require no further npm publication.

## Current audit and next maintenance update (2026-10-15)

Local and remote main agree at `56d8932`. PR #274 adopted 17 updates; PR #275 published four packages, reverified in npm with integrity metadata. Main has zero open CodeQL and Dependabot alerts. New PRs: #276 (Unicorn, failed CI), #277 (routine updates), #278 (Happy DOM 21, original CI passed). Consolidate Happy DOM 21 and Zod 4.6.7 into #277 and validate six packages. Close duplicate #278 only after #277 is confirmed merged. TypeScript 7, Unicorn 78, tsup 9 and other candidates require separate evaluation. M1b/M1c remain open.

[2026-10-15 maintenance record](implementation_plans/20261015-status-and-dependency-maintenance.md)

## Dependency refresh (2026-10-11)

On 2026-10-11, rechecked used direct dependencies from latest main `8f91525` and updated 17 packages to current compatible releases. Ported the Next 16.4.0 glob patch; Node types 26.6.5 are verified on Node 24. TypeScript 7 is outside typescript-eslint/TypeDoc peer support. The Unicorn 77 trial exposed new rules affecting public boolean names and class structure, so its migration remains separate. No new pins, ignore rules or rule suppressions are added. See the [dependency refresh record](implementation_plans/20261011-dependency-refresh.md). Both PR #273 monitor releases have been verified in npm with integrity metadata. M1b/M1c remain separate open work.

## Resumption status (2026-10-09)

M1a transport validation and Q1 public-API type-safe tests are merged in PR #269; main has zero open CodeQL and Dependabot alerts. PR #270 merged on 2026-10-09 (7391dbb); All 45 target npm versions including core 0.2.2 are verified published with distribution integrity; post-merge CI, E2E, docs, SRI and Release passed. PR #272 failed on Unicorn 77 configuration compatibility. Preserve Unicorn 64 and Node 25 types per ADR 061 while validating minor/patch updates; Node types resolve to 25.9.9. Separate major updates from the routine Dependabot group for individual review without adding ignore rules. M1b mandatory SRI/cache integrity and M1c response-size contracts remain open.

## Transport boundary remediation (2026-10-07)

PR #268 dependency fixes are merged on main `2b6b534`; audit reports zero findings and post-merge CI, E2E, Release, docs deployment and SRI refresh passed. This change implements M1a pending integration: validate URLs before cache access; use safeFetch with credentials omit and redirect error for HEAD, Range and GET. Invalid URLs, embedded credentials and remote HTTP raise SECURITY_ERROR. HEAD security refusals and aborts do not fall back. Confirm closure of CodeQL 68–70 after integration. M1b mandatory SRI, M1c response-size contracts remain incomplete. Q1 public-API tests remove any and suppression, pending integration. This change also includes Dependabot PR #267 action-download-artifact v27.

See the [issue register](ISSUES.md) for evidence, impact, and investigation items (updated 2026-10-06).

## Verified state (2026-10-07, 11:51 JST)

| Area                     | State                                                                       |
| ------------------------ | --------------------------------------------------------------------------- |
| Main                     | Local and GitHub synchronized at `3febeb0`; PRs #262, #265, and #266 merged |
| Open PRs / issues        | 0 / 0                                                                       |
| Running / queued Actions | 0 / 0                                                                       |
| Latest main validation   | CI, E2E, ESLint, and benchmarks succeeded                                   |
| Dependency security      | npm audit: one Critical (shell-quote), one High (sharp); Dependabot: zero   |
| Code scanning            | Three open High CodeQL alerts (68–70), ChunkedDownloader                    |
| Pages / SRI              | Deployment and hash refresh succeeded                                       |
| Release                  | Succeeded; no unpublished packages, no new npm versions published           |
| Local settings           | Existing Gemini and Serena changes preserved outside maintenance work       |

Workflow success does not mean all security alerts are resolved. CodeQL reports insecure downloads in the HEAD, Range, and single-fetch paths. Transport-boundary remediation has not started.

## Assets and publication readiness

KataGo and Mortal assets both returned HTTP 200 and have registered SRI values. KataGo uses a stub ONNX model and Mortal a rule-based stub Worker. Both build jobs exist. Real-model integration remains incomplete; KATAGO_ONNX_URL is not registered as a repository secret.

NPM_TOKEN is registered and was last updated on 2026-07-31. Its current expiry and write permissions have not been established. A release run with nothing to publish does not verify npm write authentication. Check this before the next actual publication without exposing secrets.

## Remaining work

Follow the [maintenance plan](implementation_plans/20261006-maintenance-and-roadmap.md): resolve CodeQL first, update fifteen routine dependencies, and complete release-readiness checks. TypeScript 7, Unicorn 77, and Node 26 types are separate migrations. Retire patches only when upstream security and compatibility are verified.

Fixed-weight ensemble selection and tests exist; opening/endgame-specific expert mapping remains unverified. Real AI models, Cloudflare CDN, hardware acceleration, and Mobile/Hybrid integrations remain future work.

The [Japanese progress log](../PROGRESS.md) retains historical incidents and measurements. Its old token-expiry dates and previous test/package counts are historical snapshots, not current operational facts.

2026-10-06 detailed follow-up: M1 is split into transport, SRI and response-contract investigation; Q1 tracks the test any occurrence and F5 dynamic expert mapping. The [issue register](ISSUES.md) contains eighteen dependency candidates, retirement criteria for fifteen patches/ten overrides, and verification matrices. Owners/dates are unassigned; implementation remains incomplete.

## 2026-10-07 update

Main remains `3febeb0`. Prioritize new audit findings S1 (Critical shell-quote) and S2 (High sharp); track the three High CodeQL alerts separately. Outdated has eighteen candidates (fifteen routine, three majors). S1/S2 are implemented and awaiting integration: shell-quote 1.11.0 and sharp 0.35.5. Both Next and Wrangler→Miniflare paths resolve securely through the vulnerable-range-only override `sharp@<0.35.5: >=0.35.5 <0.36`. Branch pnpm audit reports zero findings; lint, typecheck, build, test, Changesets status, sharp SVG-to-PNG conversion and Wrangler startup passed. Three High CodeQL alerts and other issues remain open. See the [issue register](ISSUES.md) for paths, secure floors and acceptance criteria. October 6 zero-audit results are historical.
