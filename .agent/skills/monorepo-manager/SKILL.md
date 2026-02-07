---
name: monorepo-manager
description: A skill for managing and optimizing monorepo workspaces, dependency graphs, and build pipelines, leveraging tools like pnpm workspaces and Turborepo.
version: 1.0.0
author: multi-game-engines contributors
---

# Monorepo Manager Skill

This skill assists in maintaining a healthy and performant monorepo structure.

## Capabilities

1.  **Dependency Graph Analysis**: Visualize and understand package dependencies.
2.  **Task Orchestration**: Run tasks (build, test, lint) efficiently across multiple packages, respecting topological order.
3.  **Cache Optimization**: Configure and troubleshoot build caching to speed up CI/CD.
4.  **Workspace Integrity**: Ensure version consistency for shared dependencies.

## Key Concepts

- **Workspace Protocol (`workspace:*`)**: Use this for internal dependencies to ensure the local version is always used.
- **Topological Sort**: Tasks must run in dependency order (e.g., build `core` before `adapter-stockfish`).
- **Remote Caching**: Sharing build artifacts across team members/CI (e.g., with Turborepo Remote Cache).

## Best Practices Checklist

- [ ] **Consistent Dependency Versions**: Use `syncpack` or similar tools to keep external dependency versions aligned across packages.
- [ ] **Root configuration**: Keep shared configs (tsconfig, eslintrc) in the root or a dedicated `config` package.
- [ ] **Scoping**: Use `--filter` or similar flags to run commands only on affected packages.

## Common commands (pnpm)

- `pnpm -r --filter <package_name> <command>`: Run a command in a specific package.
- `pnpm -r --filter ...[origin/main] <command>`: Run command on packages changed since main.
- `pnpm install`: Install dependencies for the entire workspace.

## Troubleshooting

- **"Module not found"**: Check if the dependency is listed in `package.json` and if the referenced workspace package is built.
- **"Version mismatch"**: Ensure standard dependencies are using the same version to avoid multiple copies in `node_modules`.
