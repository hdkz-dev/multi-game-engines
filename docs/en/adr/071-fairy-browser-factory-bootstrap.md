# ADR 071: Fairy-Stockfish browser factory bootstrap

- Date: 2026-11-07
- Status: Proposed; validation tracked in the PR

## 2026-11-07 Fairy-Stockfish browser bootstrap fix (not integrated)

The distributed stockfish.js defines an Emscripten factory rather than a Worker entry and cannot return uciok/usiok when launched directly. Registry workerFactory metadata selects the bootstrap only for default assets. Instantiate it using loader-verified main/WASM/pthread Blob URLs; keep URLs and SRI in the registry rather than copying them into consumers. Require shared memory and cross-origin isolation, bound commands queued during initialization, and verify typed UCI/USI handshakes, search, failures and Worker/Blob cleanup. Preserve custom standalone Worker overrides and native Node binaries.

This is an independent stacked diff based on dependency PR #301 head1212b303. The dependency-only no-publication statement in PR #301 does not apply to this runtime fix. Record core, UCI, USI, both Fairy adapters and registry in a Changeset, and review transitive release scope separately. Publication, merge and release remain unauthorized.

```mermaid
flowchart LR
  R[Registry URLs and SRI] --> L[EngineLoader verification]
  L --> B[Verified Blob URLs]
  B --> W[Factory bootstrap Worker]
  W --> E[Stockfish factory and pthreads]
  E --> H[UCI or USI handshake]
  H --> S[Search and bestmove]
```

## Validation and release boundary

Keep the real factory browser smoke in scripts/fairy-browser-smoke and CI. It checks SRI-backed defaults, UCI/USI handshakes, legal initial moves, no fallback and disposal. Extend ordinary pull-request validation to stacked PR targets so SDK-only reviews based on PR #301 still receive the existing checks. No Release workflow is changed. Changesets currently plans six direct patches and 47 patches after dependency propagation; this is a plan, not a publication authorization. Await adapter shutdown before revoking verified resources, and reject pending searches on Worker runtime errors instead of leaving them busy indefinitely.

## Lifecycle cancellation

Disposal aborts the lifecycle signal and waits for the in-flight load to settle before stopping the adapter and revoking verified resources. Check cancellation after loader creation and resource loading so a late custom loader cannot create a Worker after cancellation. Keep the existing 30-second fetch and 300-second chunked deadlines by composing timeout and lifecycle signals. Concurrent disposal calls share completion. An arbitrary custom adapter that ignores cancellation and never settles cannot be forcibly stopped by this Promise contract; do not report it as cleaned up. Worker faults reject in-flight searches and prevent later communication, while an explicit subsequent load may recover the adapter after the failed operation marks it as error.

## Standard package resolution and CSP

An isolated clean consumer exposed a pre-existing browser packaging failure: the standard resolver followed core/node into child_process. The earlier workspace-only external rule masked it. Keep the real Node ESM/CJS implementation under the node condition and select a browser-safe default entry that refuses native construction and can create Worker transports. Validate ordinary package exports without SDK aliases or native externals, including the bundle metafile. See the [Node conditional export contract](https://nodejs.org/api/packages.html#conditional-exports).

The Chromium fixture CSP is `default-src 'none'; script-src 'self' blob: 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' blob: https://cdn.jsdelivr.net; base-uri 'none'; frame-ancestors 'none'`. It does not permit unsafe-eval. Blob script imports, verified WASM Blob fetches and WASM compilation are exercised under this exact policy. Compatibility with a policy omitting these allowances or every browser engine has not been verified. Consumer policy is not modified by this SDK change.

Failed transport recovery terminates and unsubscribes the previous UCI/USI communicator before installing a replacement. A final dispose therefore owns and closes both transport generations.
