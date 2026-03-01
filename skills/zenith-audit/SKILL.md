---
name: zenith-audit
description: "High-fidelity quality auditing for the multi-game-engines project. Ensures 100% Zero-Any, security hardening, and physical resilience validation according to 2026 Zenith Tier standards."
---

# Zenith Tier High-Fidelity Audit

This skill provides a rigorous, exhaustive auditing protocol to ensure that the codebase meets the absolute highest engineering standards of 2026.

## Capabilities

- **Zero-Any Enforcement**: Detects and eliminates 100% of `any` types in production code.
- **Resilience Validation**: Verifies error handling for extreme edge cases (network drops, storage locks, split packets).
- **Branded Type Integrity**: Ensures FEN, SFEN, Move, and I18nKey are created ONLY via their respective factories.
- **Security Guard**: Validates "Refuse by Exception" patterns and SRI compliance.
- **Concurrency & Race condition check**: Audits async flows for Atomic Ready and stale message filtering.

## When to Use

- Before finalizing any Pull Request.
- When performing high-level architectural refactoring.
- When adding support for a new game domain or engine protocol.
- To verify the "Physical Proof" of robustness (98%+ coverage).

## How to Audit

### 1. Zero-Any Scan

Run this to find illegal manual casts or any usage:

```bash
grep -r "as any" packages/*/src
grep -r ": any" packages/*/src
```

**Zenith Rule**: No `any` allowed in production. Use `unknown` + type guard or branded factory.

### 2. Branded Factory Check

Ensure no one is bypassing factories:

```bash
grep -r "as (FEN|SFEN|Move|PositionString|PositionId|I18nKey)" packages/*/src
```

**Zenith Rule**: All branded types must use `createX(...)` factories for validation.

### 3. Resilience Checklist

Review changed files for the following:

- **Middleware Isolation**: Is every middleware call wrapped in a `try-catch`?
- **Stream Buffering**: Does the communicator handle split packets/partial lines?
- **Stale Message Filtering**: Does search result handling check the `positionId`?
- **Atomic Initialization**: Does the load promise prevent concurrent initialization?

### 4. Verification Gate

Audit the test coverage and determinism:

```bash
# Verify coverage
pnpm test --coverage
# Check for flakiness (deterministic time)
grep -r "performance.now" packages/*/src/__tests__
```

**Zenith Rule**: `performance.now()` must be mocked in tests to ensure deterministic results.

### 5. Document Parity

Ensure `docs/` and `docs/en/` are in sync using the `doc-sync` skill.

## Remediation Protocol

1.  **Refuse by Exception**: If an audit fails, do NOT fix silently. Document the failure in a "Gap Analysis" or "Audit Report" and fix it with physical test proof.
2.  **Zero-Debt Policy**: Audit findings must be resolved in the same task iteration.
