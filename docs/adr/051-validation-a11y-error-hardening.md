# ADR-051: Comprehensive Validation, A11y, and Robust Error Handling Expansion

## Status

Accepted

## Context

As the project moves towards the "Zenith Tier" (2026 Quality Standard), several areas required further hardening to ensure a premium developer and user experience:

1. **A11y (Accessibility)**: Web Components (`ChessBoard`, `ShogiBoard`) lacked comprehensive keyboard navigation and screen reader support.
2. **Schema Validation**: The `engines.json` registry file and engine configurations needed strict runtime validation to prevent invalid setups.
3. **Error Handling**: Engine factory functions threw generic `Error` objects, which missed internationalization (i18n) support and structured error codes.
4. **Network Reliability**: Loading engine resources (SRI, timeouts) lacked specific integration tests for edge cases like SRI mismatches or slow networks.

## Decision

We decided to expand the testing and validation suite across all packages to address these gaps:

### 1. Keyboard Navigation & A11y

- Implemented arrow key navigation (Grid pattern), `Home`/`End` keys, and roving tabindex for board squares.
- Added `aria-label` support for localized piece names and board coordinates.
- Created `*.keyboard.test.ts` for all board components to verify focus management.

### 2. Strict Factory Validation

- Standardized all engine factory functions (`createStockfishEngine`, etc.) to use `EngineError` instead of generic `Error`.
- Added a mandatory check for the `main` source in `IEngineConfig`.
- Integrated `I18nKey` into factory errors to support localized error messages (e.g., `factory.requiresMainSource`).

### 3. Registry & Schema Hardening

- Added Vitest boundary tests for `engines.json` using the existing JSON schema.
- Verified that invalid engine IDs or missing required fields in the registry are caught early.

### 4. Resilient Resource Loading

- Added tests for `EngineLoader` to specifically simulate and handle:
  - **SRI Mismatch**: Verified that cache is cleared and a specific `SRI_MISMATCH` error is thrown.
  - **Fetch Timeout**: Handled `AbortError` and converted it to `TIMEOUT` error.

## Consequences

- **Positive**:
  - Improved accessibility for users with disabilities.
  - Faster debugging for developers due to localized and specific error messages.
  - Higher reliability in production environments where network or registry data might be inconsistent.
- **Negative**:
  - Slightly higher maintenance cost for keeping i18n keys and tests in sync across many adapters.

## References

- [ADR-026: Protocol Input Validation "Refusal by Exception"](./026-refuse-by-exception.md)
- [ADR-029: Zenith Tier Quality Standards](./029-zenith-tier-quality-standards.md)
- [ADR-048: Zenith Tier Quality Reinforcement](./048-zenith-tier-quality-reinforcement.md)
