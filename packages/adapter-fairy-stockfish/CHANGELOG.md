# @multi-game-engines/adapter-fairy-stockfish

## 1.0.1

### Patch Changes

- [#192](https://github.com/hdkz-dev/multi-game-engines/pull/192) [`a6e41e1`](https://github.com/hdkz-dev/multi-game-engines/commit/a6e41e1120c6e20b67aabcf4fac0890530a6dd9d) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - Fix: replace `workspace:*` with `workspace:^` in published `dependencies` and `peerDependencies`.

  Previously the published `1.0.0` tarballs of both adapter packages contained `"workspace:*"` literal in their dependency declarations because they were released via `scripts/sequential-publish.mjs` (which runs `npm publish` directly, and `npm publish` does not resolve pnpm's `workspace:` protocol). This made the packages uninstallable from external consumers — `pnpm add @multi-game-engines/adapter-fairy-stockfish` failed with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`.

  Changing the protocol to `workspace:^` makes both `pnpm publish` and `changeset publish` substitute the value with the published caret range (e.g. `^1.0.0`) at release time, while still using the workspace package during local development.

  Other adapter packages (`adapter-uci`, `adapter-usi`, `domain-chess`, `domain-shogi`) were unaffected because they were originally published via `changeset publish` from prior releases, which resolves the workspace protocol correctly.
