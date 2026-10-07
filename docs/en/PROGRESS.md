# Current project progress

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
