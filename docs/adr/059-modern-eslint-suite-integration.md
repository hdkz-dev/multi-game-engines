# ADR-059: Modern ESLint Suite Integration

## Status

Accepted

## Context

Following the upgrade to ESLint v10 (Flat Config), the project aimed to adopt a modern set of ESLint plugins to enhance code quality, maintainability, and security. The target plugins included:

- `eslint-plugin-import-x`: Modern successor to `eslint-plugin-import`.
- `eslint-plugin-promise`: Enforces best practices for Promises.
- `eslint-plugin-unicorn`: Provides 100+ useful ESLint rules.
- `eslint-plugin-jsx-a11y`: Accessibility rules for React/JSX.
- `eslint-plugin-vitest`: Rules for Vitest testing.
- `eslint-plugin-tsdoc`: Validates TSDoc syntax.
- `eslint-plugin-no-only-tests`: Prevents committing `.only` in tests.
- `eslint-plugin-lit` & `eslint-plugin-wc`: Rules for Web Components and Lit templates.

## Decision

1. **Uniform Root Configuration**: Centralize the configuration in `eslint.config.mjs` at the root, applying core rules across the entire monorepo.
2. **Plugin Selection**: Adopt the "Modern Suite" specified above, prioritizing `import-x` for ESM-first compatibility.
3. **Graceful Adoption**: Initially relax or disable rules that cause widespread errors in the existing codebase (especially `unicorn` and `jsx-a11y`) to ensure a passing bridge state. These rules shall be re-evaluated and enabled incrementally.
4. **Conflict Resolution**:
   - Disabled `import-x/default` for now due to false positives in mixed ESM/CJS environments (e.g., Next.js examples).
   - Disabled `unicorn/no-empty-file` to accommodate generated build files.
   - Synchronized `jsx-a11y` registration to avoid "Cannot redefine plugin" errors in sub-packages.
5. **Environment Specifics**: Applied `vitest` plugin specifically to test files and `next` plugin to example dashboard packages.

## Consequences

- **Positive**: significantly better linting coverage for async logic, imports, and accessibility.
- **Positive**: automated enforcement of TSDoc standards and prevention of common CI pitfalls (like `.only` tests).
- **Negative**: initial configuration is quite verbose and contains many "off" switches which need future hardening.
- **Negative**: increased installation time and dependency surface area.

## Future Plans

- Periodically review `unicorn` rules currently set to `off`.
- Harden TSDoc requirements across core packages.
- Fully migrate `examples` to use `import-x` and remove legacy `eslint-plugin-import` entries.
