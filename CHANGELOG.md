# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-16

### Added

- **UI Frameworks**: Launched `ui-vue` (Vue 3) and `ui-elements` (Web Components) adapters with Zenith Tier architecture.
- **Storybook 10**: Upgraded all UI packages to Storybook 10.2.8 (ESM-only), enabled `autodocs`, and integrated Tailwind CSS v4.
- **Security**: Enforced SRI (Subresource Integrity) validation and capability detection in `EngineBridge`.
- **Telemetry**: Added memory usage tracking (`measureUserAgentSpecificMemory`) to telemetry middleware.
- **Components**: Synchronized `ScoreBadge`, `EngineStats`, `PVList`, and `EngineMonitorPanel` across all frameworks.
- **Persistent Thinking Log**: Added `SearchLog` component with smart aggregation and throttling to React, Vue, and Web Components.
- **Smart Auto-Scroll**: Implemented intelligent scroll behavior for `SearchLog` to improve user experience during active analysis.
- **Accessibility**: Achieved WCAG 2.2 AA compliance with `aria-live` announcements for critical states, enhanced keyboard navigation (Home/End support), and localized ARIA labels.
- **MCTS Support**: Added `visits` display support for Monte Carlo Tree Search engines (e.g., KataGo) across all UI components.
- **Framework Parity**: Achieved 100% functional and visual parity for `EvaluationGraph` and `CommandDispatcher` (Optimistic UI) across React, Vue, and Web Components.

### Changed

- **Architecture**: Refactored presentation logic into `ui-core/presentation.ts` for cross-framework consistency.
- **Design Tokens**: Introduced `ui-core/theme.css` to centralize styling and ensure 100% visual parity across frameworks.
- **Type Safety**: Eliminated all `any` usage project-wide. Introduced `PositionString` branded type and Zod-based `Move[]` transformation.
- **Error Handling**: Made `EngineFacade.stop()` async and robust against errors. Improved listener exception safety.
- **Documentation**: Updated READMEs for all packages to reflect the new architecture.

### Fixed

- **CI/CD**: Resolved V8-specific `captureStackTrace` type errors in CI environment.
- **Testing**: Fixed flaky tests in `EngineFacade` (atomic loading, persistent listeners) and `useEngineMonitor` mocks.
