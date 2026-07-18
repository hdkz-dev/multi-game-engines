# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Fairy-Stockfish Adapters (2026-05-30, PR #188)**: Added `@multi-game-engines/adapter-fairy-stockfish` (chess variants via jsDelivr-hosted Fairy-Stockfish 1.1.11 WASM) and `@multi-game-engines/adapter-fairy-stockfish-shogi` (shogi). Both published at 1.0.1 (PR #192, #193).
- **Comprehensive Test Coverage Uplift (2026-04-21)**: Systematically improved unit test coverage across 9 core packages, adding new test files and extending existing test suites to cover edge cases, error paths, and async lifecycle behaviours:
  - `core`: 76.26% → 84.23% — Added coverage for `BaseAdapter` stream-cancel lifecycle, `EngineFacade` concurrent search/dispose, `EngineBatchAnalyzer` cancel/pause/priority paths, `EngineConcurrencyController` status transitions, `EngineLoader` JSON/text MIME types and invalid URL rejection, `ResourceInjector` VFS mounting and Emscripten module adaptation, `DefaultTelemetryMiddleware` `onInfo`/`onProgress` paths and memory sampling, `MockAdapter` stop-mid-search and listener override paths.
  - `ui-react-monitor`: 63.76% → 97.7% — Added `SearchLog.test.tsx` (new), extended `EngineMonitorPanel.test.tsx` (keyboard navigation, error states, mate score), `useEngineMonitor.test.tsx` (status propagation, cleanup on unmount), `MockEngine.test.ts` (load lifecycle, failOnSearch, middleware, telemetry).
  - `ui-elements`: 68.21% → 96.02% — Added scroll and move-click dispatch tests for `SearchLogElement`.
  - `ui-shogi-elements`: 75.91% → 98.54% — Extended keyboard navigation and board interaction tests for `ShogiBoard`.
  - `ui-vue-monitor`: 78.32% → 94.4% — Added component rendering and event tests.
  - `ui-vue-core`: ~80% → 93.33% — Extended `EngineUIProvider` locale and slot tests.
  - `registry`: 85.86% → 93.47% — Extended registry lifecycle and error path tests.
  - `ui-react-core`: 71.42% → 100% — Full coverage of hooks and provider.
  - `i18n-core`: ~85% → 100% — Full coverage of translation utilities.
  - **New test files**: `packages/ui-elements/src/__tests__/components.test.ts`, `packages/ui-react-monitor/src/__tests__/SearchLog.test.tsx`, `packages/ui-vue-monitor/src/__tests__/components.test.ts`, `packages/adapter-katago/src/__tests__/createKataGoEngine.test.ts`, and domain edge-case test files for all 10 game domains (backgammon, checkers, chess, go, gomoku, janggi, mahjong, reversi, shogi, xiangqi).

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
