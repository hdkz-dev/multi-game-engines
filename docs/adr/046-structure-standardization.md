# ADR-046: Standardization of Directory Structures and Naming Conventions

## Status

Accepted / Pending Merge (2026-02-23)

## Context

As the number of packages in the monorepo grew to 39, inconsistencies emerged in directory layouts and file naming conventions. For example, some UI components were in the root of `src/`, while others were in `components/`. Adapter names varied between `{name}.ts` and `{Name}Adapter.ts`. These inconsistencies increased cognitive load and hampered automation.

## Decision

We establish a strict structural standard across all packages to achieve "Zenith Tier" maintainability.

### 1. UI Package Structure

All UI-related packages (React, Vue, Lit) must follow this layout:

- `src/components/`: All visual components (.vue, .tsx, .ts).
- `src/styles/`: All CSS files including `tailwind.css`.
- `src/index.ts`: Export-only entry point (Encapsulation).

### 2. Adapter Naming and Structure

All engine adapters must follow the `{Name}Adapter.ts` naming convention:

- Primary file: `src/{Name}Adapter.ts`
- Parser (if separate): `src/{Name}Parser.ts`
- Tests: `src/__tests__/{Name}Adapter.test.ts`

### 3. Core/Base Package Modularization

Complex base packages like `ui-core` must organize logic into functional subdirectories:

- `src/state/`, `src/monitor/`, `src/dispatch/`, etc.
- Each subdirectory must have an `index.ts` to allow folder-level imports.

### 4. Test Proximity

All tests must be placed in a `__tests__` directory adjacent to the code they test. Functional tests should be moved from a global `src/__tests__` to feature-specific subdirectories (e.g., `src/bridge/__tests__`).

### 5. Distribution Cleanup

- Ensure `vite-plugin-dts` uses `staticImport: true` to prevent `dist/src` nesting.
- Remove redundant `main` fields in `package.json` in favor of `exports`.

## Consequences

- **Positive**: Cognitive load is minimized; any developer can predict the location of files in any package.
- **Positive**: Encapsulation is strengthened, making internal refactoring safer.
- **Positive**: Build artifacts are cleaner and more compatible with modern ESM-native toolchains.
- **Neutral**: Large-scale import path updates were required across the entire monorepo.
