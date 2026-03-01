# Zenith Tier Quality Standards (ZENITH_STANDARD.md)

This document defines the peak design, implementation, and operational standards (Zenith Tier) for the `multi-game-engines` project. All packages and pull requests must adhere to these standards.

---

## 🏛️ 1. Architecture Standards

### 1.1. Zero-Any Architecture

- **Requirement**: The `any` type is strictly prohibited in production code. Use `unknown` with type guards or generics instead.
- **Enforcement**: Monitored via ESLint `@typescript-eslint/no-explicit-any` and `exactOptionalPropertyTypes`.

### 1.2. Facade Pattern Integrity

- **Requirement**: The `IEngine` interface must remain pure. Implementation details of adapters (WebWorker, Native Process) must be completely hidden.
- **Implementation**: Domain-specific logic must be contained in `packages/domain-*` or injected via generics.

### 1.5. Federated i18n Quality (Zero-Any i18n)

- **Standard**: Localization resources must be physically isolated by domain, ensuring 100% type safety even for dynamic access.
- **Implementation**:
  - **Physical Isolation**: Contain translation data within dedicated packages like `i18n-chess`.
  - **DeepRecord**: Use recursive Record types to structurally eliminate `any` casts or `unknown` rendering issues during i18n access.
  - **Branded Keys**: Leverage the `I18nKey` brand type to decouple the adapter layer from concrete language implementations.

---

## 🛡️ 2. Security Standards

### 2.1. Refuse by Exception

- **Requirement**: Strictly reject invalid inputs (protocol characters, path traversal) rather than attempting to sanitize them.
- **Implementation**: Centralized validation via `ProtocolValidator.assertNoInjection`.

### 2.2. Mandatory SRI
- **Requirement**: Subresource Integrity (SRI) must be verified for all external assets (.wasm, .nnue, .bin). Placeholders are strictly forbidden in production registries.
- **Fallback**: Placeholders (`__unsafeNoSRI`) are only allowed during initial development and must be automatically blocked in production registries.

---

## ⚡ 3. Performance Standards

### 3.1. Main-Thread Sanity

- **Requirement**: No heavy computation or large parsing tasks on the main UI thread.
- **Implementation**: Heavy data transformation and protocol parsing must occur within Workers. UI updates must be throttled via `requestAnimationFrame`.

### 3.2. Memory Leak Prevention

- **Requirement**: Explicit lifecycle management for all `Blob URLs` and `Worker` instances.
- **Implementation**: Use `FinalizationRegistry` or `WeakRef` for automatic cleanup of cached resources where applicable.

---

## 🌍 4. Localization Standards (i18n)

### 4.1. Federated i18n

- **Requirement**: No hardcoded strings in Core or Adapters. Error messages from engines must be mapped to i18n keys.
- **Type Safety**: Access to translation keys must be 100% type-safe via `I18nKey` Branded Types.

---

## 🛡️ 5. Robustness & Resilience Standards

### 5.1. Empirical 98% Line Coverage

- **Requirement**: Maintain at least 98.4% line coverage in the `core` package.
- **Implementation**: Physically demonstrate resilience against network failures, storage conflicts, timeouts, and thread creation failures using mocks.

### 5.2. Fault-Tolerant Middleware (Isolation)

- **Requirement**: Optional middleware failures must not stop the core engine search process.
- **Implementation**: Isolate each middleware hook in `EngineFacade` with `try-catch` blocks.

### 5.3. Message Integrity (Stream Buffering)

- **Requirement**: Guarantee message integrity even during network packet or OS pipe splitting.
- **Implementation**: Use dynamic buffering in `NativeCommunicator` to reassemble fragmented PV strings or multi-line messages before parsing.

### 5.4. Circular Reference & Overflow Protection

- **Requirement**: Physically prevent stack overflow from recursive protocol data or malicious configurations.
- **Implementation**: Incorporate `WeakSet`-based circularity detection in `ProtocolValidator`.
