# ADR-048: Zenith Tier: SRI Automation and Accessibility Reinforcement

## Status

Completed - 2026-02-24

## Context

Following the Registry migration (ADR-047), we identified gaps in security automation and UI accessibility. Specifically:

1. SRI hashes for remote assets were manual and prone to placeholder leakage.
2. UI board components (Shogi/Chess) were readable by screen readers but lacked proper keyboard navigation (Roving Tabindex).
3. Concurrent loading of remote manifests could cause race conditions.

## Decision

We reinforce the "Zenith Tier" quality standards with the following measures:

1. **SRI Automation**: Introduced `refresh-engine-sris.mjs` and a GitHub Action to automatically update integrity hashes.
2. **Robust Registry**: Implemented Promise caching in `RemoteRegistry` to prevent race conditions and enforced Zod schema validation for all manifests.
3. **Enhanced Accessibility**: Upgraded board components to support WCAG 2.2 AA standards, specifically focusing on keyboard focusability and ARIA grid patterns.
4. **Structured Errors**: Migrated registry-level errors to the core `EngineError` system for consistent handling.

## Consequences

- Enhanced security through automated integrity verification.
- Improved user experience for keyboard-only and screen-reader users.
- Higher architectural reliability when dealing with dynamic engine resources.
