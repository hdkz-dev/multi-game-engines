# Project Roadmap (2026-2027)

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
- [x] **Quality Gate Stabilisation**: `lint`, `typecheck`, `build`, `test`, `CodeQL`, and `CodeRabbit` all green.
- [ ] **Observability**: OpenTelemetry (OTel) integration for runtime performance visibility.
- [x] **Extended Adapters**:
  - **Board Games**: Backgammon (gnubg), Checkers (KingsRow), Reversi (Edax).
  - **Asian Variants**: Chinese Chess / Xiangqi, Korean Chess / Janggi.
  - **Incomplete Information**: Poker (Texas Hold'em), Contract Bridge.
- [x] **Multi-Runtime Bridge**: `resolveRuntime()` auto-selects `NativeCommunicator` (Node.js native binary) or `WorkerCommunicator` (browser Web Worker) transparently.
- [ ] **Multi-Engine Ensemble**: UI / Logic for simultaneous multi-engine analysis of the same position.

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
- [~] **Extreme Robustness**: Target ≥98.4% line coverage (98.41% reached at PR #49 → regressed to 84.6% on 2026-05-09 → restored to **97.34% (2026-05-10)** by PR #140–#150). Middleware isolation, circular reference protection, and stream buffering are implemented. The remaining ~1.06 pts are tracked in TASKS.md.
- [x] **API Reference**: TypeDoc auto-generated from all 51 packages; deploys to GitHub Pages on every push to `main`. Zero warnings achieved.
- [x] **Browser Matrix Verification**: WASM behaviour verified in real browsers via Playwright CT (React 54 tests / Vue 47 tests).
- [x] **Contract-driven Safety**: Zod runtime validation at Worker communication boundaries.
- [x] **Zero-Any Policy**: Complete elimination of `any` in production code.
- [ ] **Continuous Benchmarking**: Per-PR NPS regression detection (e.g. CodSpeed).

---

## 🔮 Future Vision

- **WebNN Acceleration**: Next-generation NNUE engines with hardware acceleration.
- **P2P Engine Sharing**: Opening book generation network via distributed computing.
- **Multi-Agent Analysis**: Simultaneous analysis and ensemble inference across multiple engines.
