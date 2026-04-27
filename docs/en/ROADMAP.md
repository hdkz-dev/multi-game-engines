# Project Roadmap (2026-2027)

Leveraging 2026 Web standards to deliver industry-leading game analysis performance in the browser.

---

## 🚀 Phase 1: Foundation & Zenith Architecture (Completed)

**Goal**: Establish a future-proof architecture and type system.

- [x] **Monorepo Structure**: Separate `core` and `adapters` via npm workspaces.
- [x] **Zero-Any Policy**: 100% elimination of `any`, domain protection via Branded Types.
- [x] **Facade Pattern**: Clean separation between user-facing `IEngine` and internal `IEngineAdapter`.
- [x] **Legal Isolation**: MIT-licensed adapters with dynamic loading of copyleft binaries.
- [x] **Capability Detection**: Auto-diagnostics for OPFS, WebNN, and WASM SIMD/Threads.

---

## 🔥 Phase 2: Power & Resilience (Ongoing)

**Goal**: Maximize performance and stability via hardware acceleration and empirical hardening.

- [x] **Federated i18n Architecture**: Physically isolated language modules with recursive type safety.
- [x] **Standardized Core (task_0001)**: Score normalization, `positionId` conflict control, and structured PV.
- [x] **Universal Storage & Flow Control**: CLI/Node.js support (`NodeFSStorage`), `AbortSignal` standardization, and resumable loading.
- [x] **Binary Variant Selection**: Auto-dispatching optimal binaries based on SIMD/Threads support.
- [x] **Extreme Robustness**: 98.41% line coverage. Middleware isolation, circular reference protection, and stream buffering.
- [ ] **Hardware Acceleration**:
  - **WebNN**: NPU/GPU-accelerated NNUE inference (W3C 2026 CR).
  - **WebGPU Compute**: Offloading MCTS and parallel search to the GPU.
- [ ] **Swarm (Ensemble) Architecture**:
  - **Meta-Adapters**: Multi-engine consensus and expertise-based weighting.
- [x] **Release Automation**: Changesets pipeline with `release.yml` wired to npm publish. Awaiting `NPM_TOKEN` secret registration to go live.
- [x] **Quality Gate Stabilization**: PR #60 reached green status for `lint`, `typecheck`, `build`, `test`, `CodeQL`, and `CodeRabbit`.

---

## 💎 Phase 3: The Zenith Tier

**Goal**: 100% autonomous quality maintenance and world-class reliability.

- [x] **Empirical Hardening**: Verified resilience against network failures and packet splitting.
- [x] **A11y Audit**: WCAG 2.2 Level AA compliance for all board components.
- [x] **Self-Healing Docs**: TypeDoc API reference auto-generated from all 47 packages. Deploys to GitHub Pages on every push to main via `docs.yml`.
- [ ] **Continuous Benchmarking**: NPS regression tracking on every PR.
