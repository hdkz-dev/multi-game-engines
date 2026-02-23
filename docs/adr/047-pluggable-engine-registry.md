# ADR-047: Pluggable Engine Metadata Registry

## Status

Proposed (2026-02-23)

## Context

Currently, engine resource metadata (URLs and SRI hashes) are hardcoded directly within each adapter's source code. This approach has several drawbacks:

1. **Maintenance Overhead**: Changing a single hash requires modifying multiple adapter files.
2. **Scalability Issues**: Supporting multiple versions of the same engine complicates the adapter logic.
3. **Rigid Configuration**: Third-party adapters or external projects cannot easily reuse our metadata or provide their own without duplicating core logic.
4. **Security Risk**: SRI hashes stored alongside the code are safe, but manual updates are prone to human error.

## Decision

We will introduce a decentralized, pluggable engine registry system.

### 1. Architecture

We will separate the "Metadata Source" from the "Engine Execution Logic".

- **`IEngineRegistry`**: A standard interface for resolving engine metadata.
- **Resolution Chain**: `EngineBridge` will maintain a list of registries. When getting an engine, it will try to resolve metadata in the following order:
  1. Direct injection via `sources` in `getEngine` options (highest priority).
  2. Custom registries registered via `bridge.addRegistry(custom)`.
  3. The official registry package (`@multi-game-engines/registry`).

### 2. Interface Definition

```typescript
export interface IEngineRegistry {
  resolve(
    id: string,
    version?: string,
  ): Record<string, IEngineSourceConfig> | null;
  getSupportedEngines(): string[];
}
```

### 3. Official Registry Package

A new package `@multi-game-engines/registry` will be created to host:

- `engines.json`: The source of truth for official engine metadata.
- `StaticRegistry`: A registry implementation that uses the bundled JSON.
- `RemoteRegistry`: A registry that fetches metadata from a trusted URL at runtime.

### 4. Security Mandates

- **Final Validation**: Regardless of the source, `EngineBridge` will perform a final validation to ensure `main` entry and `sri` hash are present before initialization.
- **Refuse by Exception**: If no valid SRI hash can be resolved, the bridge MUST throw a `SECURITY_ERROR`.

## Consequences

- **Positive**: Centralized management of engine versions and hashes.
- **Positive**: Easy integration of third-party engines without core changes.
- **Positive**: Support for "hot updates" of engine metadata via remote registries.
- **Negative**: Adds a small amount of abstraction complexity to the engine acquisition flow.
