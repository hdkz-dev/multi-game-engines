# Zenith Tier Quality Standards

This document defines the peak design, implementation, and operational standards ("Zenith Tier") for `multi-game-engines`. All packages and pull requests must adhere to these standards.

---

## 🏛️ 1. Architecture Standards

### 1.1. Zero-Any Architecture

- **Requirement**: The `any` type is strictly prohibited in production code.
- **Implementation**: Runtime validation (Zod etc.) at communication boundaries (Worker `postMessage`) is mandatory. Incoming data must be branded immediately. Unavoidable casts must go through a validator function — never a raw `as unknown as T`.

### 1.2. Protocol-First Abstraction

- **Requirement**: Adapters implement a protocol (UCI, USI, GTP, etc.) and must not depend on a specific engine binary.
- **Implementation**: Use generic adapters such as `adapter-uci`. Engine name, binary URL, and SRI are injected from external configuration (JSON / DI).

### 1.3. Side-Effect Free Core

- **Requirement**: The `core` package must hold no global state and consist only of pure functions and classes.
- **Implementation**: Keep `"sideEffects": false` in `package.json` to maximise tree-shaking.

### 1.4. Domain-Driven Modular Isolation (Pay-as-you-go)

- **Requirement**: Logic and types specific to a particular game (Chess, Shogi, Go, etc.) must be isolated behind a sub-path (e.g. `/chess`, `/shogi`) and must not be directly exported from the top-level entry point.
- **Implementation**: When an application writes `import ... from "@multi-game-engines/ui-react/shogi"`, not a single byte of Chess or Go code may appear in the bundle.

### 1.5. Uniform Directory Structure (Predictable Refactoring)

- **Requirement**: File layout and naming conventions must be unified across the entire monorepo (ADR-046).
- **Implementation**:
  - **UI**: Components in `src/components/`, styles in `src/styles/`. `src/index.ts` hides internals.
  - **Adapters**: `{Name}Adapter.ts` and `{Name}Parser.ts` naming strictly enforced.
  - **Tests**: `__tests__` folders co-located with the code under test.
  - **Distribution**: `exports` entry points are mandatory; redundant `main` fields removed.

### 1.6. Federated i18n Quality (Zero-Any i18n)

- **Requirement**: Localization resources must be physically isolated by domain, with 100% type safety even for dynamic access.
- **Implementation**:
  - **Physical Isolation**: Translation data encapsulated in dedicated packages (`i18n-chess`, `i18n-shogi`, etc.).
  - **DeepRecord**: Recursive Record types structurally eliminate `any` casts and `unknown` rendering in i18n access paths.
  - **Branded Keys**: The `I18nKey` brand type decouples the adapter layer from concrete language implementations.

---

## ⚡ 2. Performance Standards

### 2.1. Main-Thread Protection

- **Requirement**: All engine computation and heavy protocol parsing must run in Web Workers, keeping the main thread's Total Blocking Time (TBT) below 50 ms.
- **Implementation**: `ui-core` throttling (RAF sync) is mandatory; UI repaints are capped at 60/120 fps.

### 2.2. Zero-Latency Experience

- **Requirement**: Required resources must be ready before the user begins interacting.
- **Implementation**: Following the speculative-preloading guideline, WASM and weight files are fetched in the background on hover or app start.

### 2.3. Multi-Resource Optimisation

- **Requirement**: Large resources (NN weight files, NNUE, etc.) must leverage OPFS to minimise memory consumption.
- **Implementation**: Avoid loading fully into memory; prefer `ReadableStream`-based chunk-by-chunk processing.

---

## 🛠️ 3. Developer Experience Standards

### 3.1. Self-Healing Documentation

- **Requirement**: Divergence between code changes and documentation (TECHNICAL_SPECS.md, API reference) is not tolerated.
- **Implementation**: TypeDoc auto-generates the API reference from all 51 packages, deployed to GitHub Pages on every `main` push. Zero warnings required.

### 3.2. Hermetic Development

- **Requirement**: After `pnpm install`, builds and tests must pass without network access (using cache).
- **Implementation**: Turborepo remote and local caches are managed strictly.

---

## 💎 4. Quality & Accessibility Standards

### 4.1. Continuous Benchmarking

- **Requirement**: NPS (Nodes Per Second) regression must be detected on every PR.
- **Implementation**: Performance regression tests via CodSpeed or equivalent tooling.

### 4.2. Inclusive Board UI (WCAG 2.2 AA)

- **Requirement**: Screen reader and keyboard-only users must be able to analyse positions and follow games.
- **Implementation**: All squares have `aria-label`, live regions announce dynamic updates, and full keyboard navigation (Arrow keys, Home/End, Ctrl+Home/End, PageUp/PageDown) is supported.

---

## 🛡️ 5. Security Standards

### 5.1. Immutable Trust Chain (SRI Mandatory)

- **Requirement**: All external binaries and assets (.wasm, .nnue, .bin) must be SRI-verified. Placeholders (`__unsafeNoSRI`) are forbidden in the official registry's production builds.
- **Implementation**: `__unsafeNoSRI` is restricted to local development or temporary prototypes; the CI/CD pipeline automatically blocks it from reaching the production registry.

### 5.2. Secure Context Isolation

- **Requirement**: Designs must assume Cross-Origin Isolation (COOP/COEP).
- **Implementation**: `SharedArrayBuffer` usage is safely encapsulated; functionality degrades gracefully in unsupported environments.

### 5.3. Refuse by Exception

- **Requirement**: Protocol injection and path traversal risks must be countered by rejection, not sanitisation.
- **Implementation**: Per ADR-026, detection of illegal control characters or paths throws `EngineError` (SECURITY_ERROR) with a `remediation` field explaining the correct format.

---

## 🏗️ 6. Robustness & Resilience Standards

### 6.1. Empirical 98% Line Coverage

- **Requirement**: Maintain ≥ 98.4% line coverage in the `core` package.
- **Current (measured 2026-05-10, after PR #140–#147)**: lines **95.72%** / statements **94.79%** / branches **83.95%** / functions **91.61%**. Down from 98.41% at PR #49 to 84.6% on 2026-05-09; PR #140–#147 added test coverage for `NativeCommunicator`, `WorkerCommunicator`, `ProtocolValidator`, `IndexedDBStorage`, `EngineBridge`, `SecurityAdvisor`, `EnvironmentDiagnostics`, `BaseAdapter`, `EngineFacade`, and `OPFSStorage`, recovering 11+ points. The remaining ~2.7 pts are concentrated in `IndexedDBStorage` (versionchange retry), `ResourceInjector` (alternate transports), `ChunkedDownloader` (Range/SRI failure), and `EngineLoader` (concurrent inflight); tracked in TASKS.md.
- **Implementation**: The test suite must physically demonstrate resilience against network failures, storage conflicts, incomplete data, timeouts, and thread creation failures via mocks.

### 6.2. Fault-Tolerant Middleware (Isolation)

- **Requirement**: Optional middleware failures (telemetry, logging, etc.) must not halt the core engine search.
- **Implementation**: `EngineFacade` middleware hooks are wrapped in `try-catch`. On failure, engine state is preserved and an `EngineError` is surfaced externally.

### 6.3. Message Integrity (Stream Buffering)

- **Requirement**: Message integrity must be guaranteed even when OS pipes or network packets split messages.
- **Implementation**: `NativeCommunicator` implements dynamic buffering to fully reassemble fragmented PV strings (or any large message) before parsing.

### 6.4. Circular Reference & Overflow Protection

- **Requirement**: Stack overflow caused by circular references in protocol data or configurations must be physically prevented.
- **Implementation**: `ProtocolValidator` incorporates `WeakSet`-based circularity detection to protect the process from maliciously nested input.
