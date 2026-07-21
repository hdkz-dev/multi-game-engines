---
"@multi-game-engines/ui-chess": patch
"@multi-game-engines/ui-chess-elements": patch
"@multi-game-engines/ui-chess-react": patch
"@multi-game-engines/ui-elements": patch
"@multi-game-engines/ui-react": patch
"@multi-game-engines/ui-shogi": patch
"@multi-game-engines/ui-shogi-elements": patch
"@multi-game-engines/ui-shogi-react": patch
"@multi-game-engines/ui-vue": patch
---

Stop publishing the TypeScript incremental build cache.

These nine packages shipped `dist/tsconfig.tsbuildinfo` in their tarballs.
`tsconfig.base.json` sets `composite: true`, so when `tsBuildInfoFile` is not
specified TypeScript writes the cache into `outDir` — which is `dist`, the one
directory `files` publishes. The `files` allow-list added in #221 could not
catch it because the file is inside `dist` rather than beside it.

Each package now points `tsBuildInfoFile` at `node_modules/.cache/`, keeping the
cache out of the published output. No runtime or type-resolution change: the
cache is a build artifact only.
