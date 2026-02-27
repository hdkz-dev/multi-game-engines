# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Federated i18n Architecture (ADR-049)**: Decoupled the monolithic i18n package into domain-isolated physical packages (`i18n-core`, `common`, `chess`, `shogi`, `engines`, `dashboard`). This ensures "Pay-as-you-go" bundle sizes and physically prevents cross-domain knowledge leakage.
- **Zero-Any i18n Safety**: Achieved 100% type safety for dynamic translation access via recursive `DeepRecord` types and Branded `I18nKey`, structurally eliminating unsafe casts project-wide.
- **Standardized Directory Structure (ADR-046)**: Reorganized all 39 packages into a predictable, best-practice layout. Consolidated components into `src/components/`, styles into `src/styles/`, and modularized `ui-core`.
- **Adapter Naming Symmetry**: Renamed all engine adapters to `{Name}Adapter.ts` (e.g., `StockfishAdapter`, `KataGoAdapter`) for project-wide consistency.
- **Privacy-First Logging (ADR-038)**: Implemented automated log truncation for sensitive position data (FEN/SFEN) to prevent PII/SPI leaks in diagnostics.
- **Resource Injector Handshake (ADR-043)**: Introduced a reliable host-worker handshake protocol (`MG_INJECT_RESOURCES` -> `MG_RESOURCES_READY`) to ensure flawless WASM initialization.
- **Generic State Expansion**: Enabled application-specific state extensions in `SearchMonitor` and `createInitialState` via TypeScript generics, achieving 100% type-safe custom dashboards.
- **Subscription Manager**: Centralized multi-subscription lifecycle management with atomic, idempotent cleanup.

### Changed

- **Absolute Zenith Audit**: Addressed over 94 review comments across the entire monorepo, elevating every package to 2026 "Zenith Tier" standards.
- **Distribution Polish**: Optimized `package.json` by prioritizing `exports` and removing redundant `main` fields. Configured `vite-plugin-dts` for flat declaration output.
- **Security Hardening**: Enforced strict SRI validation across all adapters, including cross-origin pre-check and placeholder detection.
- **Deterministic Testing**: Modernized test infrastructure with `performance.now` mocking and explicit fake timer targets for 100% deterministic CI results.

### Fixed

- **Resource Lifecycle**: Fixed potential memory leaks in `EngineLoader` by implementing snapshot-based rollbacks and ensuring atomic Blob URL revocation.
- **Protocol Normalization**: Unified edge cases in USI/UCI and Mahjong protocols (e.g., handling "none" as `null` for `bestMove`) to ensure type safety.
- **Dependency Versioning**: Pinned `eslint` and `react-hooks` versions to resolve transitive resolution bugs in monorepo environments.

## [Unreleased - Zenith Tier Initial] - 2026-02-18

### Added

- **Zenith Hybrid Dashboard**: Launched a cross-framework engine analysis dashboard (React/Next.js and Vue/Nuxt) supporting real-time best-move synchronization.
- **Board Components**: Introduced framework-agnostic `<chess-board>` and `<shogi-board>` Web Components using Lit and CSS Grid.
- **Asset Autonomy**: Inlined all standard Chess piece assets as SVG Data URIs to eliminate external dependencies and ensure SRI compliance.
- **Hardened Parsers**: Implemented strict FEN and SFEN parsers in `ui-core` with robust boundary checking and rule-accurate validation (e.g., rejecting promoted Kings).
- **Subpath Exports**: Added `@multi-game-engines/ui-react/hooks` and `@multi-game-engines/ui-vue/hooks` for optimized, tree-shakeable hook-only imports.
- **Dynamic Localization**: Enabled dynamic piece name injection and configurable error overlays for boards, supporting seamless language switching.

### Changed

- **Type Safety Zenith**: Enforced Branded Types (`FEN`, `SFEN`, `Move`) across component props and eliminated remaining unsafe `as unknown as` casts in `MonitorRegistry` and `useEngineMonitor`.
- **Pure State Transformer**: Removed module-level side effects from `SearchStateTransformer` by introducing internal counters within `EngineSearchState`, ensuring strictly pure state transitions.
- **NPS Scaling**: Improved Performance stats display with intelligent scaling (k for thousands, M for millions) and localized units.
- **Initialization UX**: Replaced blank dashboard screens with a high-fidelity loading spinner during engine/bridge setup.
- **Security Audit**: Enforced HTTPS for engine resources and added strict SRI checks in `EngineLoader`.

### Fixed

- **Parser Edge Cases**: Resolved issues with trailing hand digits in SFEN and missing turn fields in FEN parsing.
- **React 19 Compatibility**: Updated custom element type augmentations to target `react/jsx-runtime` for modern build toolchains.

## [0.1.0] - 2026-02-16
