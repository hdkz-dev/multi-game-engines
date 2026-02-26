# Zenith Tier Quality Standards (ZENITH_STANDARD.md)

This document defines the peak design, implementation, and operational standards (Zenith Tier) for the `multi-game-engines` project. All packages and pull requests must adhere to these criteria to ensure absolute technical integrity.

---

## 🏛️ 1. Architectural Standards

### 1.1. Zero-Any Architecture

- **Standard**: 100% prohibition of the `any` type in production code.
- **Implementation**: Use Zod for runtime validation at communication boundaries (Worker `postMessage`). Branded Types (`FEN`, `Move`) must be applied immediately. Unavoidable type narrowing must use validator functions instead of raw `as unknown as T`.

### 1.2. Protocol-First Abstraction

- **Standard**: Adapters must be implemented against protocols (UCI, USI, GTP, etc.) rather than specific engine implementations.
- **Implementation**: Leverage generic packages like `adapter-uci`. Engine metadata (ID, URL, SRI) must be injected via external configuration.

### 1.3. Domain-Driven Modular Isolation (Pay-as-you-go)

- **Standard**: Logic and types specific to a game must be isolated in subpaths (e.g., `/chess`, `/shogi`) and never exported from the top-level entry point.
- **Implementation**: Ensure that an application importing from `@multi-game-engines/ui-react/shogi` does not bundle a single byte of Chess or Go code.

### 1.4. Uniform Directory Structure (ADR-046)

- **Standard**: Strictly unify file placement and naming conventions.
- **Implementation**:
  - **UI**: Components in `src/components/`, styles in `src/styles/`.
  - **Adapters**: Adhere to `{Name}Adapter.ts` naming.
  - **Tests**: `__tests__` folders must be adjacent to the code they test.

### 1.5. Federated i18n Quality (Zero-Any i18n)

- **Standard**: Localization resources must be physically isolated by domain, ensuring 100% type safety even for dynamic access.
- **Implementation**:
  - **Physical Isolation**: Contain translation data within dedicated packages like `i18n-chess`.
  - **DeepRecord**: Use recursive Record types to structurally eliminate `any` casts or `unknown` rendering issues during i18n access.
  - **Branded Keys**: Leverage the `I18nKey` brand type to decouple the adapter layer from concrete language implementations.

---

## ⚡ 2. Performance & Security Standards

### 2.1. Main-Thread Protection

- **Standard**: All heavy engine computations and parsing must run in Web Workers.
- **Implementation**: Lock UI updates to 60fps using `requestAnimationFrame` (RAF) synchronization in `ui-core`.

### 2.2. Immutable Trust Chain (SRI)

- **Standard**: SRI (Subresource Integrity) hash validation is mandatory for all external binaries.
- **Implementation**: Re-fetch and re-verify resources on every load if SRI mismatches. Use of `__unsafeNoSRI` is forbidden in production.

### 2.3. Refuse by Exception (Strict Rejection)

- **Standard**: Never use incomplete sanitization for security-critical inputs. Reject invalid inputs immediately.
- **Implementation**: Per ADR-026, throw `EngineError` (SECURITY_ERROR) upon detecting illegal control characters in protocol strings.
