# Current project progress

## Verified state (2026-10-06, 15:50 JST)

| Area                     | State                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| Main                     | Local and GitHub synchronized at `9c4aff7`; PRs #262 and #265 merged  |
| Open PRs / issues        | 0 / 0                                                                 |
| Running / queued Actions | 0 / 0                                                                 |
| Latest main validation   | CI, E2E, ESLint, and benchmarks succeeded                             |
| Dependency security      | npm audit and Dependabot: zero findings                               |
| Code scanning            | Three open High CodeQL alerts (68–70), ChunkedDownloader              |
| Pages / SRI              | Deployment and hash refresh succeeded                                 |
| Release                  | Succeeded; no unpublished packages, no new npm versions published     |
| Local settings           | Existing Gemini and Serena changes preserved outside maintenance work |

Workflow success does not mean all security alerts are resolved. CodeQL reports insecure downloads in the HEAD, Range, and single-fetch paths. Transport-boundary remediation has not started.

## Assets and publication readiness

KataGo and Mortal assets both returned HTTP 200 and have registered SRI values. KataGo uses a stub ONNX model and Mortal a rule-based stub Worker. Both build jobs exist. Real-model integration remains incomplete; KATAGO_ONNX_URL is not registered as a repository secret.

NPM_TOKEN is registered and was last updated on 2026-07-31. Its current expiry and write permissions have not been established. A release run with nothing to publish does not verify npm write authentication. Check this before the next actual publication without exposing secrets.

## Remaining work

Follow the [maintenance plan](implementation_plans/20261006-maintenance-and-roadmap.md): resolve CodeQL first, update eleven routine dependencies, and complete release-readiness checks. TypeScript 7, Unicorn 77, and Node 26 types are separate migrations. Retire patches only when upstream security and compatibility are verified.

Fixed-weight ensemble selection and tests exist; opening/endgame-specific expert mapping remains unverified. Real AI models, Cloudflare CDN, hardware acceleration, and Mobile/Hybrid integrations remain future work.

The [Japanese progress log](../PROGRESS.md) retains historical incidents and measurements. Its old token-expiry dates and previous test/package counts are historical snapshots, not current operational facts.
