# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Zenith Tier Quality**: Enhanced core components with rigorous type safety and best practices.
- **Subscription ID Management**: Added `unuse` to `IEngine` for middleware cleanup and made `SubscriptionManager` idempotent.
- **Enhanced Board Localization**: Localized default labels and error messages in `<chess-board>` and `<shogi-board>` using shared i18n resources.
- **StatCard (Vue)**: Added missing `StatCard` component to the Vue dashboard for UX parity with React.
- **Ref-based Props (React)**: Switched to `useRef` for passing complex objects (like `pieceNames`) to custom elements in React 19.

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
