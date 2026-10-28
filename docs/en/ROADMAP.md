# Project Roadmap (2026-2027)

## 2026-10-28 SRI and response contract changes (locally validated; integration pending)

M1b/M1c are locally validated; remote verification and integration are pending. `ChunkedDownloader.download(url, { sri })` requires full-resource SRI in its type and at runtime; omission raises `SECURITY_ERROR`. Both EngineLoader and direct downloads revalidate persisted bytes. Cache identities hash complete URLs and SRI values with SHA-256 into fixed-length names, so old cache entries are not reused. Multiple hashes use SecurityAdvisor's strongest-algorithm selection. Segment hashes supplement the full hash and must match segmentSize, request width, and resource size.

Responses require safe integer Content-Length values, exact 206 Content-Range intervals, and exact chunk lengths. A 200 response to a Range request is rejected. HEAD transport failures/non-success may fall back to a single GET; security refusal, abort, and malformed lengths cannot. Compressed single responses are not compared against compressed Content-Length. `maxBytes` defaults to 512 MiB and can be explicitly adjusted; streaming stops on overflow. Completion is emitted only after integrity, size, and abort checks.

A core minor changeset records the direct API compatibility change. Migrate callers to explicit `{ sri }` and supply `maxBytes` when large resources require it. EngineLoader uses declared config.size as its limit. `cacheKey()` now returns a Promise and must be awaited. Publication requires separate version/scope approval. See [ADR 069](adr/069-verified-resource-response-contract.md).

## 2026-10-28 maintenance audit and remaining work

Main `ce432366` includes PRs #288, #289 and #290. The Unicorn 79 migration and 51-package release are complete; earlier integration/publication pending statements are historical. Remaining work includes Workers type update PR #291, OSV auditing, M1b (SRI/cache integrity), and M1c (response contracts). TypeScript 7, upstream-dependent patch removal, and F1–F5 external prerequisites/future features remain separate.

OSV now reports GHSA-gcqx-w48m-w2h4 in deepmerge 4.3.1 in addition to the Nuxt 4.6.2 GHSA-vjh5-4x84-xrqp finding. Upstream Nuxt advisory PR #10504 remains open. The Nuxt→Nitro→Rollup resolver path uses deepmerge only to clone fixed defaults. A version-scoped patch replaces this operation with `structuredClone`, and a readPackage hook removes the dependency. Regression checks cover CJS/ESM and frozen defaults. Workers types use a ^5.20261025.1 range and resolve to mature 5.20261027.1. Public packages and APIs are unchanged; no audit exclusions are added. See [ADR 068](adr/068-remove-deepmerge-from-resolver.md).

## Unicorn 79 configuration migration (2026-10-26)

Post-merge verification of PR #288 completed on main `d75a296`. Release succeeded without additional publication; all 45 published versions remain unchanged and no changesets are pending. CI failed only for the approved GHSA-vjh5-4x84-xrqp false positive; the complete audit is not reported as successful.

The Unicorn 79 migration replaces the removed `flat/recommended` reference and implicit recommendation inheritance with an explicit project rule contract in `eslint-unicorn-policy.mjs`. All 58 previously enabled rules remain errors, with six additional correctness rules for promises, string replacement, comparisons and bitwise operations. Upstream style-preset changes do not dictate public API renames; additional rules are reviewed individually. No new off settings, ignores or audit exclusions are added. Regression tests check effective package configurations and contrasting invalid/valid code. Public package versions, APIs and the ES2022 support contract remain unchanged. See [ADR 067](adr/067-explicit-unicorn-rule-policy.md). Frozen install, lint 98/98, typecheck 99/99, build 56/56, 149 Vitest files / 1,710 tests, 15 tooling tests, TypeDoc and document synchronization passed. Full and production pnpm audits both report zero advisories. Findings from two CodeRabbit passes were corrected or resolved with frozen-install evidence. Remote CI, post-merge verification and publication remain pending. Changeset status proposes 51 public patch updates; the final list must be reconciled in the release PR.

The updated checks exposed translation values such as `$&`, `$$` and context tokens being interpreted as replacement syntax. A replacement callback inserts values literally, with six regression cases using repeated placeholders. Internal guards in core, Checkers and Gomoku only reorder conditions without side effects. Changed public packages receive patch changesets; publication requires separate confirmation of targets and authorization.

## Latest verification addendum (2026-10-25)

PR #286, release PR #280 and follow-up PR #287 have merged into main (`aca79a5` at inspection). Exact versions and dist.integrity were verified for all 53 public npm packages, including the 45 updated releases. GitHub reports zero open Dependabot and CodeQL alerts. OSV still incorrectly matches fixed Nuxt 4.6.2 through GHSA-vjh5-4x84-xrqp; upstream PR #10504 remains pending. PR #287 integrated Node 24.22.1, Release commit ownership and the unique PR #285 regression test. This separate update adopts the now-mature ESLint React 5.28.8, Portless 0.15.11 and Workers types 5.20261024.1 updates. With Node 24.22.1, uncached lint 98/98, typecheck 99/99, build 56/56, 1,697 Vitest cases and 13 tooling tests passed. These dependency changes affect development tooling or private packages and require no further npm publication.

## Release Action commit ownership (2026-10-25)

Set `commit` to `false` in `.changeset/config.json` to remove duplicate commit ownership between the Changesets CLI and Release Action. The CLI generates versions and changelogs; the Release Action commits the result. Release proposal contents and approval requirements remain unchanged. [ADR 066](adr/066-release-action-owns-version-commits.md) records the evidence and validation criteria.

## Post-merge verification (2026-10-25)

Maintenance PR [#286](https://github.com/hdkz-dev/multi-game-engines/pull/286) merged into main at 2026-10-25 01:20 JST with merge commit `db25265`. The OSV data defect remains unresolved; post-merge CI, E2E and Release runs are being checked. The Node 24.22.1 version-file update was not included in that merge, so validate it as a separate change based on current main. Zero pnpm audit findings do not mean that OSV auditing or publication has completed.

## Development Node LTS update (2026-10-25)

Update `.node-version` and `.nvmrc` from 24.13.0 to the Node 24 LTS security release 24.22.1. Verify the [official release index](https://nodejs.org/dist/index.json) and distribution SHA-256, then run the quality gates with Node 24.22.1. CI continues to select the Node 24 line. Public APIs and published package compatibility ranges are unchanged. The upstream OSV audit blocker remains a separate unmet condition.

## Waiting for the upstream OSV correction (2026-10-25)

Implementation commit `2ea32d5` in maintenance PR [#286](https://github.com/hdkz-dev/multi-game-engines/pull/286) passed CI build, lint, typecheck, tests, core coverage and document synchronization, all four E2E lanes, ESLint, CodeQL and benchmarks. Full and production pnpm audits report zero findings. However, the OSV audit fails because the Nuxt 3 ranges in GHSA-vjh5-4x84-xrqp lack an upper bound and incorrectly match the fixed nuxt / @nuxt/nitro-server 4.6.2 releases. Overall auditing has not passed.

Independently validated the existing upstream PR [github/advisory-database#10504](https://github.com/github/advisory-database/pull/10504) against all 277 published stable Nuxt versions and 32 published stable @nuxt/nitro-server versions; membership matches the maintainer's affected ranges. [Added downstream CI reproduction evidence](https://github.com/github/advisory-database/pull/10504#issuecomment-6385792027). The upstream PR is still open and OSV has not incorporated the correction. Rerun CI after confirming propagation. No audit exclusions have been added.

## Development dependencies and tools refresh (2026-10-24)

From main `2d9ffbc`, update 43 direct dependency families plus pnpm 12.15.0 and OSV Scanner 2.7.0. Adopt Next 16.4.3, Storybook 10.6.3, Nuxt 4.6.2 and tsup 9.0.0; pnpm audit reports zero findings at every severity. Move pnpm settings to pnpm-workspace.yaml while retaining strict peer checks, the same approved build packages and a 24-hour release-age policy. Do not exempt newly published releases. TypeScript 7 remains outside supported tool peer ranges. Unicorn 78 produces 644 new rule findings in core alone and requires a separate migration involving public APIs and asynchronous behavior. Publication of #280 and M1b/M1c remain pending.

[Maintenance record](implementation_plans/20261024-toolchain-refresh.md) / [ADR 065](adr/065-pnpm12-and-toolchain-refresh.md)

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

Leveraging 2026 Web standards to deliver industry-leading game analysis performance in the browser.

---

## 🚀 Phase 1: Foundation & Zenith Architecture (Completed)

**Goal**: Establish a future-proof architecture and type system.

- [x] **Monorepo Structure**: Separate `core` and `adapters` via npm workspaces.
- [x] **Zero-Any Policy**: 100% elimination of `any`, domain protection via Branded Types.
- [x] **Facade Pattern**: Clean separation between user-facing `IEngine` and internal `IEngineAdapter`.
- [x] **Legal Isolation**: MIT-licensed adapters with dynamic loading of copyleft binaries.
- [x] **EngineBridge & BaseAdapter Implementation**: Core logic complete.
- [x] **CapabilityDetector**: Auto-diagnostics for OPFS, WebNN, and WASM SIMD/Threads.

---

## 🎨 UI Architecture (2026 Standard)

The UI layer uses a two-tier architecture that minimises framework coupling while maximising performance.

- **Reactive Core (`ui-core`)**: Framework-agnostic business logic. Handles state management, NPS scaling, position analysis, and render optimisation via `requestAnimationFrame`.
- **Framework Adapters**: `ui-react`, `ui-vue`, and `ui-elements` (Lit). Modularised into base (core), monitoring (monitor), and game UI (game) sub-packages — import only what you need.
- **Contract-driven UI**: Engine output is validated at runtime with Zod schemas, structurally preventing UI crashes.

---

## 🏁 Phase 2: Early Release Strategy (Stage 1 – UI Foundation) (Completed)

**Goal**: Complete integration of major engines and UI foundations; establish a usable analysis tool base.

- [x] **Chess/Shogi Integration**: Public CDN loader for Stockfish and Yaneuraou.
- [x] **Security Audit**: "Refuse by Exception" policy established and recursively verified.
- [x] **Core-UI Bridge**: UI foundation for React / Next.js / Vue.
- [x] **Thinking Log**: Persistent log storage and performance optimisation.
- [x] **Board UI**: Framework-agnostic Chess and Shogi board components.
- [x] **IP Safety**: Project-wide rename to Reversi; trademark risk eliminated.

---

## 🔥 Phase 3: Power & Resilience (Stage 2) (Ongoing)

**Goal**: Surpass browser performance limits with a custom build pipeline and AI-assisted operations.

- [ ] **Build Pipeline**: Automated Emscripten / Rust optimised builds (SIMD128, Multithreading).
- [x] **Turborepo Integration**: Fast build pipeline with parallel execution and caching.
- [ ] **Hardware Acceleration (Zenith Standard)**:
  - **WebNN**: NPU/GPU-accelerated NNUE inference (W3C 2026 CR).
  - **WebGPU Compute**: Offloading parallel search algorithms to the GPU.
- [ ] **Swarm (Ensemble) Architecture**:
  - **Ensemble Adapters**: Multi-engine consensus system.
  - **Expert Mapping**: Dynamic move selection weighted by engine specialisation (opening / endgame).
- [ ] **Mobile & Hybrid Bridge (Native Power)**:
  - **Hybrid Bridge**: Transparent WASM / native binary switching per environment (Browser / Node / Desktop).
  - **Mobile Native Bridge**: Maximum-performance engine execution in mobile OS native environments via Capacitor / Cordova plugins.
- [x] **Modular Split**: Physical separation of UI packages (core / monitor / game) — "Pay-as-you-go" architecture.
- [x] **Federated i18n Architecture**: Physically isolated language modules with Zero-Any type safety.
- [x] **Standardized Core (task_0001)**: Cross-game score normalisation, `positionId` conflict control, structured PV.
- [x] **Universal Storage & Flow Control**: Node.js / Bun CLI support, `AbortSignal` standardisation, resumable loading.
- [x] **Binary Variant Selection**: Auto-dispatching optimal WASM binary based on SIMD / Threads capability.
- [ ] **Custom Distribution**: Binary supply via private CDN (Cloudflare R2 / Workers).
- [x] **Release Automation**: Changesets pipeline with `release.yml` wired to npm publish. `@changesets/changelog-github` generates PR-attributed changelogs automatically.
- [x] **Quality Gate Stabilisation**: Verification workflows are established. Latest main CI passes, but three High CodeQL alerts remain open. CLI CodeRabbit reviews and skipped GitHub bot reviews are distinct.
- [x] **Observability**: OpenTelemetry (OTel) integration for runtime performance visibility.
- [x] **Extended Adapters**:
  - **Board Games**: Backgammon (gnubg), Checkers (KingsRow), Reversi (Edax).
  - **Asian Variants**: Chinese Chess / Xiangqi, Korean Chess / Janggi.
  - **Incomplete Information**: Poker (Texas Hold'em), Contract Bridge.
- [x] **Multi-Runtime Bridge**: `resolveRuntime()` auto-selects `NativeCommunicator` (Node.js native binary) or `WorkerCommunicator` (browser Web Worker) transparently.
- [x] **Multi-Engine Ensemble**: UI / Logic for simultaneous multi-engine analysis of the same position.

---

## 📱 Phase 4: Platform Expansion (Stage 3)

**Goal**: Native-level performance on mobile and desktop.

- [ ] **Hybrid Bridge**: Native plugin adapters for React Native / Capacitor.
- [ ] **Native Build**: Integration of Android NDK / iOS C++ native binaries.

---

## 💎 Phase 5: The Zenith Tier

**Goal**: 100% autonomous quality maintenance and world-class reliability.

- [x] **Turborepo & CI Optimisation**: 100% reproducible fast execution on CI.
- [x] **Zenith Tier Audit**: Thorough A11y / logic audit across all packages.
- [x] **Extreme Robustness**: Target ≥98.4% line coverage (98.41% reached at PR #49 → regressed to 84.6% on 2026-05-09 → fully restored to **98.45% (2026-05-11)** by PR #140–#161 ✅ **target met**). CI pins thresholds at `lines ≥98.4 / branches ≥88` (PR #161); the Coverage Restoration backlog is fully closed. Middleware isolation, circular reference protection, and stream buffering are implemented.
- [x] **API Reference**: TypeDoc auto-generated from all 51 packages; deploys to GitHub Pages on every push to `main`. Zero warnings achieved.
- [x] **Browser Matrix Verification**: WASM behaviour verified in real browsers via Playwright CT (React 54 tests / Vue 47 tests).
- [x] **Contract-driven Safety**: Zod runtime validation at Worker communication boundaries.
- [x] **Zero-Any Policy**: Complete elimination of `any` in production code.
- [x] **Merge Policy (NO SQUASH)**: To preserve the in-branch iteration trail on `main`, squash merge is **forbidden at three layers — agent memory, policy docs, and the GitHub repo setting** (PR #163). `allow_squash_merge: false` makes it physically impossible; `gh pr merge --merge` is the only sanctioned path.
- [ ] **Continuous Benchmarking**: Per-PR NPS regression detection (e.g. CodSpeed).

---

## 🔮 Future Vision

- **WebNN Acceleration**: Next-generation NNUE engines with hardware acceleration.
- **P2P Engine Sharing**: Opening book generation network via distributed computing.
- **Multi-Agent Analysis**: Simultaneous analysis and ensemble inference across multiple engines.

## Dependency updates and validation (2026-09-17)

Dependency updates target stable npm releases while preserving public APIs and verifying supported tooling combinations. Direct dependencies use compatible version ranges. Transitive overrides are limited to audited security floors and documented compatibility fixes.

ESLint and Oxlint accessibility checks jointly enforce the lint gate, including warnings. TypeScript declaration checking remains enabled; deprecated compiler options are corrected instead of suppressed. See [ADR 061](adr/061-dependency-refresh-and-strict-validation.md) for migration decisions and compatibility constraints.

2026-09-18: Nitro ZIP output now uses Archiver 8, removing deprecated transitive dependencies. React/Vue E2E checks include browser warnings and unhandled exceptions. Initial positions, optional Vue props, search cancellation, and UI error reporting were corrected; ADR 061 records the details and validation results.

2026-09-27: Integration review hardened command error handling so failures from a previous engine or an older operation cannot overwrite the current UI. ADR 061 records the additional dependency updates and validation results.

See [ADR 061](./adr/061-dependency-refresh-and-strict-validation.md) for dependency constraints and the Dependabot failure diagnosis as of 2026-10-04.

Development tooling cryptography and glob dependencies migrate to safe implementations. See [ADR 062](./adr/062-development-tooling-security-backends.md) for the graph, scoped versions, and regression validation.

2026-10-06: Address five newly reported vulnerabilities using vulnerable-range overrides for simple-git >=4.0.1 <5, @simple-git/argv-parser >=2.0.1 <3, and source-map-js >=1.2.2 <2. Update the Nuxt DevTools 3.4.2 Git factory import to its named export and verify branch/revparse/status compatibility. Remove these overrides and the patch once upstream adopts secure dependency ranges.

## Remaining work and execution order (2026-10-06)

Prioritize the three open High CodeQL alerts in ChunkedDownloader, fifteen routine dependency updates, and release-readiness/documentation alignment. Handle TypeScript 7, Unicorn 77, and Node 26 types as separate migrations. KataGo and Mortal assets return HTTP 200 and have registered SRI values, but remain stubs; real-model integration is incomplete. The KataGo model URL secret is absent, and both stub build jobs exist. Release succeeded with no unpublished packages; it did not publish new npm versions. See the [execution plan](implementation_plans/20261006-maintenance-and-roadmap.md) for prerequisites and acceptance criteria.

- [ ] **Phase-specific expert mapping**: Fixed-weight ensemble strategy and tests exist; dynamic opening/endgame mapping remains unverified.

2026-10-06 detailed follow-up: M1 is split into transport, SRI and response-contract investigation; Q1 tracks the test any occurrence and F5 dynamic expert mapping. The [issue register](ISSUES.md) contains eighteen dependency candidates, retirement criteria for fifteen patches/ten overrides, and verification matrices. Owners/dates are unassigned; implementation remains incomplete.

## 2026-10-07 update

Main remains `3febeb0`. Prioritize new audit findings S1 (Critical shell-quote) and S2 (High sharp); track the three High CodeQL alerts separately. Outdated has eighteen candidates (fifteen routine, three majors). S1/S2 are implemented and awaiting integration: shell-quote 1.11.0 and sharp 0.35.5. Both Next and Wrangler→Miniflare paths resolve securely through the vulnerable-range-only override `sharp@<0.35.5: >=0.35.5 <0.36`. Branch pnpm audit reports zero findings; lint, typecheck, build, test, Changesets status, sharp SVG-to-PNG conversion and Wrangler startup passed. Three High CodeQL alerts and other issues remain open. See the [issue register](ISSUES.md) for paths, secure floors and acceptance criteria. October 6 zero-audit results are historical.
