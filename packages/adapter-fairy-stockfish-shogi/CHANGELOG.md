# @multi-game-engines/adapter-fairy-stockfish-shogi

## 1.0.2

### Patch Changes

- [#221](https://github.com/hdkz-dev/multi-game-engines/pull/221) [`31525da`](https://github.com/hdkz-dev/multi-game-engines/commit/31525da38b3ea8f2b581edc784731d97076ce60a) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - 公開 tarball から不要ファイルを除外しました。

  全公開パッケージの package.json に `files` フィールドを設定し、`dist` と `README.md` / `LICENSE` のみを同梱するよう統一しています(`@multi-game-engines/registry` は `data`、`@multi-game-engines/ui-core` は `src/styles/theme.css` を追加で同梱)。

  これまで `files` 未設定だった 31 パッケージでは、CI のビルドログ (`.turbo/*.log`)、`tsconfig.tsbuildinfo`、`src/` とテストファイル、各種ビルド設定ファイルが tarball に混入していました。ランタイムの公開 API に変更はありません。ソースマップには `sourcesContent` が埋め込まれているため、`src/` を除外してもソースマップ経由のデバッグは引き続き可能です。

- Updated dependencies [[`ad3f836`](https://github.com/hdkz-dev/multi-game-engines/commit/ad3f83668b8e1bf8219e72351220557cdaa44e06), [`31525da`](https://github.com/hdkz-dev/multi-game-engines/commit/31525da38b3ea8f2b581edc784731d97076ce60a)]:
  - @multi-game-engines/core@0.2.1
  - @multi-game-engines/adapter-usi@1.0.2
  - @multi-game-engines/registry@1.1.1

## 1.0.1

### Patch Changes

- [#192](https://github.com/hdkz-dev/multi-game-engines/pull/192) [`a6e41e1`](https://github.com/hdkz-dev/multi-game-engines/commit/a6e41e1120c6e20b67aabcf4fac0890530a6dd9d) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - Fix: replace `workspace:*` with `workspace:^` in published `dependencies` and `peerDependencies`.

  Previously the published `1.0.0` tarballs of both adapter packages contained `"workspace:*"` literal in their dependency declarations because they were released via `scripts/sequential-publish.mjs` (which runs `npm publish` directly, and `npm publish` does not resolve pnpm's `workspace:` protocol). This made the packages uninstallable from external consumers — `pnpm add @multi-game-engines/adapter-fairy-stockfish` failed with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`.

  Changing the protocol to `workspace:^` makes both `pnpm publish` and `changeset publish` substitute the value with the published caret range (e.g. `^1.0.0`) at release time, while still using the workspace package during local development.

  Other adapter packages (`adapter-uci`, `adapter-usi`, `domain-chess`, `domain-shogi`) were unaffected because they were originally published via `changeset publish` from prior releases, which resolves the workspace protocol correctly.
