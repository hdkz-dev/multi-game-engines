# Decision Log

This document indexes the major design decisions recorded as ADRs (Architecture Decision Records).

> **Note (2026-02-19)**: ADRs 003–013 were numbered during the initial design exploration phase but were absorbed or superseded by later decisions (ADR-014–026 etc.) and are now intentionally omitted. Numbers are not reused; the gap is preserved for historical traceability.

---

## 🏗️ Architecture

- [ADR-001: Adoption of Monorepo Structure](../adr/001-monorepo-structure.md) (Accepted - 2026-01-28)
- [ADR-002: Streaming Communication via Async Iterable](../adr/002-async-iterable.md) (Accepted - 2026-01-29)
- [ADR-014: Physical Separation of Core and Adapters](../adr/014-mit-license-architecture.md) (Accepted - 2026-02-10)
- [ADR-031: Strict TypeScript Monorepo and Project References](../adr/031-strict-typescript-monorepo.md) (Accepted - 2026-02-18)
- [ADR-032: Migration to Zenith Tier Tech Stack (Q1 2026)](../adr/032-zenith-tech-stack-2026.md) (Accepted - 2026-02-18)
- [ADR-040: Ensemble Adapter Architecture](../adr/040-ensemble-adapter-architecture.md) (Proposed - 2026-02-21)
- [ADR-041: Mobile Native Bridge Architecture](../adr/041-mobile-native-bridge-architecture.md) (Proposed - 2026-02-21)
- [ADR-046: Standardisation of Directory Structures and Naming Conventions](../adr/046-structure-standardization.md) (Accepted - 2026-02-23)

## 📦 Resources & Security

- [ADR-015: CDN Selection Strategy and Fallbacks](../adr/015-cdn-selection-strategy.md) (Accepted - 2026-02-11)
- [ADR-019: Resource Centralisation via EngineLoader (SRI Mandatory)](../adr/019-engine-loader-centralization.md) (Accepted - 2026-02-13)
- [ADR-038: Privacy-First Logging Policy](../adr/038-privacy-first-logging.md) (Accepted - 2026-02-20)
- [ADR-039: OPFS Storage Implementation](../adr/039-opfs-storage-implementation.md) (Completed - 2026-02-21)
- [ADR-043: ResourceInjector Handshake Protocol for Reliable Initialisation](../adr/043-resource-injector-handshake.md) (Completed - 2026-02-21)
- [ADR-044: ESLint v9 Pinning and Monorepo Configuration Stability](../adr/044-eslint-v9-pinning.md) (Superseded by ADR-057 - 2026-03-04)
- [ADR-047: Pluggable Engine Metadata Registry](../adr/047-pluggable-engine-registry.md) (Completed - 2026-02-24)
- [ADR-048: Zenith Tier Quality Reinforcement](../adr/048-zenith-tier-quality-reinforcement.md) (Completed - 2026-02-24)
- [ADR-049: Federated i18n Architecture](../adr/049-federated-i18n-architecture.md) (Completed - 2026-02-26)
- [ADR-056: ESLint React Configuration Modernisation](../adr/056-eslint-react-modernization.md) (Accepted - 2026-03-04)
- [ADR-057: Immediate ESLint v10 Upgrade and Peer Dependency Warning Suppression](../adr/057-eslint-v10-upgrade.md) (Accepted - 2026-03-04)
- [ADR-059: Modern ESLint Suite Integration (import-x, unicorn, jsx-a11y, etc.)](../adr/059-modern-eslint-suite-integration.md) (Accepted - 2026-03-05)

## 🔌 Interfaces & Protocol

- [ADR-018: Separation of Adapter Metadata and State](../adr/018-adapter-metadata-state-separation.md) (Accepted - 2026-02-12)
- [ADR-020: Bidirectional Middleware and Promise Behaviour on Abort](../adr/020-bidirectional-middleware.md) (Accepted - 2026-02-14)
- [ADR-021: Real-Time Thinking Info Streaming Interface](../adr/021-real-time-info-streaming.md) (Accepted - 2026-02-14)
- [ADR-022: Cache Consistency on Middleware Addition](../adr/022-facade-cache-invalidation.md) (Accepted - 2026-02-15)
- [ADR-023: Message Buffering in Worker Communication](../adr/023-worker-message-buffering.md) (Accepted - 2026-02-15)
- [ADR-024: Handle-Based Lifecycle Management and Shared Adapter Protection](../adr/024-handle-based-lifecycle.md) (Accepted - 2026-02-16)
- [ADR-025: Separation of Core and Adapter Domain Info (Pure Domain Info)](../adr/025-pure-domain-info.md) (Accepted - 2026-02-16)
- [ADR-026: Promoting Protocol Input Validation to "Refuse by Exception"](../adr/026-refuse-by-exception.md) (Accepted - 2026-02-17)
- [ADR-030: Structured Score Information Unification](../adr/030-structured-score-unification.md) (Accepted - 2026-02-18)

## 🚀 Release & Integration

- [ADR-016: Staged Release Strategy](../adr/016-two-stage-release.md) (Accepted - 2026-02-11)
- [ADR-017: Native Bridge Integration Policy](../adr/017-native-integration.md) (Accepted - 2026-02-12)
- [ADR-045: Absolute Zenith Quality Audit and Consistency Synchronisation](../adr/045-absolute-zenith-audit.md) (Accepted - 2026-02-23)
- [ADR-050: Advanced Development Skills Integration](../adr/050-advanced-dev-skills-integration.md) (Accepted - 2026-02-27)
- [ADR-051: Comprehensive Validation, A11y, and Robust Error Handling Expansion](../adr/051-validation-a11y-error-hardening.md) (Accepted - 2026-02-27)
- [ADR-052: Zenith Hardening & Standardised Score Normalisation](../adr/052-zenith-hardening-score-normalization.md) (Completed - 2026-02-27)
- [ADR-053: Pluggable Storage Architecture](../adr/053-pluggable-storage-architecture.md) (Completed - 2026-02-27)
- [ADR-054: Extreme Robustness and High Coverage Testing Strategy](../adr/054-extreme-robustness-strategy.md) (Accepted - 2026-02-28)

## 🎨 UI & Presentation

- [ADR-027: Framework-Agnostic UI and Reactive Core Introduction](../adr/027-framework-agnostic-ui.md) (Accepted - 2026-02-17)
- [ADR-028: Migration to Storybook 10 and ESM-Only Configuration](../adr/028-storybook-10-esm-transition.md) (Accepted - 2026-02-17)
- [ADR-029: Definition of Zenith Tier Quality Standards](../adr/029-zenith-tier-quality-standards.md) (Accepted - 2026-02-18)
- [ADR-033: Framework-Agnostic Board Components](../adr/033-framework-agnostic-boards.md) (Accepted - 2026-02-19)
- [ADR-034: UI Package Full Modularisation and Monitor Separation](../adr/034-ui-modular-split-and-monitor-separation.md) (Accepted - 2026-02-19)
- [ADR-035: Custom Element and Property Integration Patterns in React 19](../adr/035-react-19-custom-elements-integration.md) (Accepted - 2026-02-19)
- [ADR-036: Zenith Tier PR Audit and Strict Type Safety Re-application Across the Monorepo](../adr/036-zenith-audit-and-strict-types.md) (Accepted - 2026-02-20)
- [ADR-037: Physical Isolation of Core and Domain Packages and Lifecycle Hardening](../adr/037-core-domain-isolation-and-lifecycle-hardening.md) (Accepted - 2026-02-20)
- [ADR-042: Mobile UI and Monitor Design Standard](../adr/042-mobile-ui-and-monitor-design.md) (Proposed - 2026-02-21)
- [ADR-055: Standardisation of Piece Visualisation via pieceSymbols Property](../adr/055-piece-symbols-standardization.md) (Accepted - 2026-03-01)
- [ADR-058: Introduction of ESLint Plugins for Lit and Web Components](../adr/058-eslint-lit-wc-introduction.md) (Accepted - 2026-03-05)
