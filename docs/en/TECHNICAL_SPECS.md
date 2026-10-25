# Technical Specifications (TECHNICAL_SPECS.md)

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

## Current implementation and maintenance scope (2026-10-07)

PR #268 dependency fixes are merged on main `2b6b534`; audit reports zero findings and post-merge CI, E2E, Release, docs deployment and SRI refresh passed. This change implements M1a pending integration: validate URLs before cache access; use safeFetch with credentials omit and redirect error for HEAD, Range and GET. Invalid URLs, embedded credentials and remote HTTP raise SECURITY_ERROR. HEAD security refusals and aborts do not fall back. Confirm closure of CodeQL 68–70 after integration. M1b mandatory SRI, M1c response-size contracts remain incomplete. Q1 public-API tests remove any and suppression, pending integration. This change also includes Dependabot PR #267 action-download-artifact v27.

KataGo/Mortal assets have registered SRI and return HTTP 200, but are stubs. See the [execution plan](implementation_plans/20261006-maintenance-and-roadmap.md) and [current progress](PROGRESS.md) for priorities, acceptance criteria, and verified operational state.

## 1. Core Type Definitions

### Maintenance API and verification boundaries

`ChunkedDownloader.download(url, options)` is publicly exported; `options.sri` is optional. Full SRI verification is conditional, and the API handles cache, HEAD, Range and single-fetch paths. EngineLoader delegates when SRI and explicit size of at least 32 MiB are supplied; timeout defaults are 300 seconds for this path and 30 seconds for ordinary fetching.

This describes current behavior, not compliance with mandatory-SRI policy. M1a/M1b decide transport/integrity contracts; M1c reproduces response-size, cancellation and redirect scenarios. Determine breaking-change, migration-guide and changeset requirements before implementation. See the [verification matrix](ISSUES.md).

The `core` package provides abstract definitions independent of specific games.

### 1-1. Base Definitions

- **Brand<K, T>**: Common helper for generating Branded Types.
- **NormalizedScore**: Branded number mapped from -1.0 to 1.0.
- **EngineStatus**: Lifecycle states (`loading`, `ready`, `busy`, etc.).
- **EngineErrorCode**: Standardized error codes.

### 1-2. Search Info (IBaseSearchInfo)

Highly standardized structure for engine candidate data.

- **`positionId`**: Unique identifier for the board position, used for stale message filtering.
- **`score` (Standardized Score)**:
  - `raw`: Raw numeric value from engine.
  - `unit`: Evaluation unit (`cp`, `mate`, `points`, `winrate`, `diff`).
  - `normalized`: `NormalizedScore` (-1.0 to 1.0).
- **`pv` (Structured PV)**: Array of `Move[]` (Branded Types) instead of raw strings.
- **`depth`, `seldepth`, `nodes`, `nps`, `time`, `hashfull`**: Standard metrics.

### 1-3. Universal I/O & Flow Control

- **`AbortSignal`**: Required parameter for `loadResource`, `search`, and `analyze`.
- **`ILoadProgress`**: Standard object for progress notifications.
  - `status`: 'connecting', 'downloading', 'verifying', 'completed', 'aborted'.
  - `loadedBytes`: Current transferred bytes.
  - `totalBytes`: Expected total size.
- **`ProgressCallback`**: `(progress: ILoadProgress) => void`.

### 1-4. Environment-Agnostic Storage (IFileStorage)

- **`OPFSStorage`**: High-performance browser Origin Private File System (Primary).
- **`IndexedDBStorage`**: Browser-based fallback.
- **`NodeFSStorage`**: Node.js/Bun local file system.
- **`MemoryStorage`**: Ephemeral in-memory storage.
- **Custom Injection**: Users can inject custom `IFileStorage` via `IEngineBridgeOptions`.

### 1-5. Bridge Configuration (IEngineBridgeOptions)

- **`storage?: IFileStorage`**: Override auto-detected storage with a custom implementation.
- **`capabilities?: Partial<ICapabilities>`**: Force or disable specific environment capabilities.

### 1-6. Domain-Specific Types (Domain Types)

Game-specific types (`FEN`, `SFEN`, `GOMove`, etc.) are provided by their respective domain packages (`@multi-game-engines/domain-*`) to avoid circular dependencies and ensure consistency across UI and adapter layers.

- **`Move<T>` (Hierarchical Branding)**: Base move type defined in `core`. Each domain extends it as `Move<"ShogiMove">`, preventing cross-domain confusion at the compiler level while retaining base `Move` compatibility.
- **FEN / SFEN**: Position notation strings (Branded). Inherits from `PositionString<T>` with strict validation of character set, field count, side-to-move, etc.
- **`create*Move` / `create*Board`**: Domain packages provide validator-factory functions that eliminate unsafe `as` casts and throw `EngineError` immediately for invalid input (Refuse by Exception).

### 1-3. Loading Strategy

- `manual`: Resources are not fetched until `load()` is explicitly called.
- `on-demand` _(default)_: If `search()` is called before loading, the load starts automatically and is awaited.
- `eager`: Load starts immediately on engine instance creation (`getEngine`).

## 2. Engine Facade (IEngine)

Primary API for application developers.

- **Auto-Type Inference**: `bridge.getEngine('stockfish')` automatically infers the correct generic types via the `EngineRegistry`.
- `load()`: Initialization with SRI validation and persistent cache loading.
- `search(options)`: Asynchronous search with automatic loading. **Middleware Isolation** protects the main process from crashes in individual middleware hooks using per-hook `try-catch`.
- `onInfo(callback)`: Real-time subscription to thinking info via normalization middleware.
- `consent()`: Resumes loading after explicit license agreement.
- `stop()`: Graceful search interruption (Async).
- `dispose()`: Releases engine resources and clears managed subscriptions.

## 3. Advanced Analysis

### 3-1. Batch Analysis (EngineBatchAnalyzer)

Efficiently analyzes entire game records (move lists).

- **Prioritized Interruption**: `analyzePriority` allows real-time analysis to preempt background batch processing.
- **Flow Control**: Supports `pause()`, `resume()`, and `abort()`.

### 3-2. Opening Book Provider (IBookProvider)

Manages huge book assets independently.

- **`loadBook(asset, options)`**: Loads book data and returns a Blob URL or physical path accessible to WASM.

## 4. Security & Infrastructure

### 4-1. EngineLoader (Zenith Tier)

- **SRI Mandatory**: Hash validation is enforced for all resources. Blank `sri` requires explicit `__unsafeNoSRI` flag.
- **Atomic Multi-load**: Fetches and validates multiple dependencies (WASM + NNUE) as a single atomic unit.
- **Auto-Revocation**: Automatically revokes old Blob URLs to prevent memory leaks.
- **30s Timeout**: Prevents hang-ups during network fetch with detailed Error Cause API tracking.

### 4-2. Protocol Validation (Structural Defense)

Parsers call `ProtocolValidator.assertNoInjection` before command generation.

- **Target**: `createSearchCommand` (positions), `createOptionCommand` (names/values).
- **Checks**: Control characters like `\n`, `\0`, `;`.
- **Circular Protection**: Uses `WeakSet` to detect and reject recursive objects, preventing stack overflow from malicious input.
- **Policy**: Reject (Throw) instead of Sanitize.

### 4-3. Hybrid Bridge

- **Environment Detection**: Determines runtime (Browser vs Node.js).
- **Interface Consistency**: `WebWorkerAdapter` and `NativeCommunicator` share the same `IEngineAdapter` interface.
- **Stream Buffering**: `NativeCommunicator` implements internal buffering to reassemble messages split across OS pipe packets (e.g., extremely long PV strings).

## 5. Hardware Acceleration & AI Inference (Zenith Tier)

### 5-1. WebNN (Neural Network API)

- **Target**: Hardware-accelerated NNUE inference using NPU / GPU (W3C 2026 CR).
- **Diagnostic**: `HardwareAccelerator.diagnose()` reports available backends (`cpu`, `gpu`, `npu`) and their performance tiers.
- **Fallback**: Automatically falls back to WASM if WebNN is unavailable.

### 5-2. WebGPU Compute

- **Target**: Offload MCTS and parallel search algorithms to the GPU.
- **Implementation**: `WorkletAdapter` binds a WASM module to a `GPUDevice`; compute shaders execute parallel position evaluation.

### 5-3. Zenith Loader (Large-Scale Asset Delivery)

- **Segmented Download**: Splits >100MB files into 10MB chunks with HTTP Range requests.
- **Incremental SRI**: `SegmentedVerifier` validates each chunk's SHA-384 hash before assembly, enabling early corruption detection without waiting for the full download.
- **Resume on Failure**: Any interrupted chunk resumes from its last byte on retry.

## 6. Telemetry & Observability

The `DefaultTelemetryMiddleware` collects structured performance data without coupling business logic to monitoring.

- **`onInfo` sampling**: Records per-move NPS and depth distributions.
- **`onProgress` tracking**: Captures load latency and byte-level throughput.
- **Memory sampling**: Periodic `performance.measureUserAgentSpecificMemory()` snapshots (where available).
- **Export**: Telemetry events flow to `emitTelemetry()` on the engine facade; consumers can forward to OpenTelemetry collectors or custom dashboards.

## 7. UI & Presentation Layer

### 7-1. Reactive Engine Store (`ui-core`)

- **Throttling**: Synchronizes with `requestAnimationFrame` (60/120fps) to prevent UI thread saturation from high-frequency engine data.
- **Deterministic Snapshots**: Full compatibility with React `useSyncExternalStore` to prevent rendering "tearing".
- **Zod Validation**: Validates all incoming engine messages at the UI boundary.

### 7-2. Federated i18n Architecture

- **Physical Isolation**: `i18n-chess`, `i18n-shogi`, etc., are separate packages.
- **Zero-Any Safety**: Recursive `DeepRecord` types ensure 100% type safety when accessing nested translation keys.
- **Pay-as-you-go**: Minimum bundle size by only including required language modules.

### 7-3. Web Accessibility (A11y) Standards

All UI components must strictly adhere to the following accessibility standards:

- **Compliance**: WCAG 2.2 Level AA.
- **ARIA Roles & Landmarks**:
  - Game boards must use `role="grid"` with squares as `role="gridcell"`.
  - Dynamic content updates (engine info) must use `aria-live="polite"`.
  - Error notifications must use `role="alert"`.
- **Keyboard Navigation**:
  - Proper `tabindex` management and visible focus indicators using `:focus-visible`.
  - Arrow key support for board navigation; Enter/Space for details.
  - `Home` / `End` / `Ctrl+Home` / `Ctrl+End` / `PageUp` / `PageDown` support for deterministic jumps to row edges and board edges.
  - Proper focus trapping for modal/overlay elements.
- **Workspace Type Resolution**: UI hub packages must use `tsconfig.paths` to reference internal Web Components type definitions directly so monorepo-parallel `build` and `typecheck` runs do not depend on package build order.
- **Visual & Layout**:
  - Minimum contrast ratio of 4.5:1 for text and 3:1 for UI elements.
  - Supports 400% zoom without horizontal scrolling (Reflow).
- **Automated Validation**: Mandatory `axe-core` scanning in CI/CD via Playwright.

## 8. Testing Philosophy

- **Empirical 98.4% Coverage**: Targets ≥98.4% line coverage in `core`. PR #49 reached 98.41%; regressed to 84.6% on 2026-05-09; fully restored to **98.45% (2026-05-11)** by PR #140–#161 ✅ **target met**. CI pins thresholds at `lines ≥98.4 / branches ≥88` (PR #161); the Coverage Restoration backlog is fully closed. Mock-based proofs against network failures, storage locks, and timeouts remain in place.
- **Deterministic Telemetry**: Mocks `performance.now()` for environment-independent verification.
- **Zero-Any Policy**: 100% elimination of `any` in production and test code.

## 9. AI Agent Skills (Modular Capabilities)

Standardized framework for extending AI agent capabilities across the monorepo.

### 9-1. Skill Structure (SKILL.md)

Each skill is a self-contained directory in `skills/` containing:

- **`SKILL.md`**: Frontmatter metadata (name, description) and instructions.
- **`README.md`** (Optional): User-facing documentation.
- **`tools/`** (Optional): Scripts or local MCP tools associated with the skill.

### 9-2. Core Skills

- **`zenith-audit`**: Automated Grep-based auditing for Zero-Any and Branded Type compliance.
- **`doc-sync`**: Maintenance of Japanese/English documentation parity.
- **`code-review`**: Integration with external auditing tools like CodeRabbit.

## Dependency updates and validation (2026-09-17)

Dependency updates target stable npm releases while preserving public APIs and verifying supported tooling combinations. Direct dependencies use compatible version ranges. Transitive overrides are limited to audited security floors and documented compatibility fixes.

ESLint and Oxlint accessibility checks jointly enforce the lint gate, including warnings. TypeScript declaration checking remains enabled; deprecated compiler options are corrected instead of suppressed. See [ADR 061](adr/061-dependency-refresh-and-strict-validation.md) for migration decisions and compatibility constraints.

2026-09-18: Nitro ZIP output now uses Archiver 8, removing deprecated transitive dependencies. React/Vue E2E checks include browser warnings and unhandled exceptions. Initial positions, optional Vue props, search cancellation, and UI error reporting were corrected; ADR 061 records the details and validation results.

2026-09-27: Integration review hardened command error handling so failures from a previous engine or an older operation cannot overwrite the current UI. ADR 061 records the additional dependency updates and validation results.

See [ADR 061](./adr/061-dependency-refresh-and-strict-validation.md) for dependency constraints and the Dependabot failure diagnosis as of 2026-10-04.

Development tooling cryptography and glob dependencies migrate to safe implementations. See [ADR 062](./adr/062-development-tooling-security-backends.md) for the graph, scoped versions, and regression validation.

2026-10-06: Address five newly reported vulnerabilities using vulnerable-range overrides for simple-git >=4.0.1 <5, @simple-git/argv-parser >=2.0.1 <3, and source-map-js >=1.2.2 <2. Update the Nuxt DevTools 3.4.2 Git factory import to its named export and verify branch/revparse/status compatibility. Remove these overrides and the patch once upstream adopts secure dependency ranges.

## 2026-10-07 update

Main remains `3febeb0`. Prioritize new audit findings S1 (Critical shell-quote) and S2 (High sharp); track the three High CodeQL alerts separately. Outdated has eighteen candidates (fifteen routine, three majors). S1/S2 are implemented and awaiting integration: shell-quote 1.11.0 and sharp 0.35.5. Both Next and Wrangler→Miniflare paths resolve securely through the vulnerable-range-only override `sharp@<0.35.5: >=0.35.5 <0.36`. Branch pnpm audit reports zero findings; lint, typecheck, build, test, Changesets status, sharp SVG-to-PNG conversion and Wrangler startup passed. Three High CodeQL alerts and other issues remain open. See the [issue register](ISSUES.md) for paths, secure floors and acceptance criteria. October 6 zero-audit results are historical.
