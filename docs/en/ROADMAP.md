# Project Roadmap (2026-2027)

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
