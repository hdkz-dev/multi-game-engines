# @multi-game-engines/adapter-katago

## 1.0.2

### Patch Changes

- Updated dependencies [[`f7fa5e1`](https://github.com/hdkz-dev/multi-game-engines/commit/f7fa5e1ee20b8d7fb99cccd81816c4d8795f4ce2)]:
  - @multi-game-engines/i18n-common@0.1.4

## 1.0.1

### Patch Changes

- [#221](https://github.com/hdkz-dev/multi-game-engines/pull/221) [`31525da`](https://github.com/hdkz-dev/multi-game-engines/commit/31525da38b3ea8f2b581edc784731d97076ce60a) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - 公開 tarball から不要ファイルを除外しました。

  全公開パッケージの package.json に `files` フィールドを設定し、`dist` と `README.md` / `LICENSE` のみを同梱するよう統一しています(`@multi-game-engines/registry` は `data`、`@multi-game-engines/ui-core` は `src/styles/theme.css` を追加で同梱)。

  これまで `files` 未設定だった 31 パッケージでは、CI のビルドログ (`.turbo/*.log`)、`tsconfig.tsbuildinfo`、`src/` とテストファイル、各種ビルド設定ファイルが tarball に混入していました。ランタイムの公開 API に変更はありません。ソースマップには `sourcesContent` が埋め込まれているため、`src/` を除外してもソースマップ経由のデバッグは引き続き可能です。

- Updated dependencies [[`ad3f836`](https://github.com/hdkz-dev/multi-game-engines/commit/ad3f83668b8e1bf8219e72351220557cdaa44e06), [`31525da`](https://github.com/hdkz-dev/multi-game-engines/commit/31525da38b3ea8f2b581edc784731d97076ce60a)]:
  - @multi-game-engines/core@0.2.1
  - @multi-game-engines/i18n-common@0.1.3

## 1.0.0

### Patch Changes

- Updated dependencies [[`9643217`](https://github.com/hdkz-dev/multi-game-engines/commit/9643217e368b1ba38ab70202f925ef0244ff7125), [`d0b16c4`](https://github.com/hdkz-dev/multi-game-engines/commit/d0b16c4178ba32f485810ea3312126efb66c5c8d), [`c70ee30`](https://github.com/hdkz-dev/multi-game-engines/commit/c70ee30b229ef39fc860385014e709b86a4e56fd), [`665899e`](https://github.com/hdkz-dev/multi-game-engines/commit/665899e8cc68aa7674df19a2c9a7947f87f5b0db)]:
  - @multi-game-engines/i18n-common@0.1.2
  - @multi-game-engines/core@0.2.0

## 0.2.0

### Minor Changes

- dd9159c: Replace GTP stub with ONNX Runtime Web adapter for KataGo (Phase B2)

  The previous KataGoAdapter extended GTPAdapter and expected a proprietary
  KataGo binary as a Web Worker. This is replaced by KataGoONNXAdapter —
  a pure TypeScript adapter that runs KataGo's neural network via
  onnxruntime-web, with no Worker or binary required.

  **Breaking changes** (minor):
  - `adapter-katago` no longer depends on `@multi-game-engines/adapter-gtp`
    or `@multi-game-engines/registry`. Remove those from your imports.
  - `KataGoAdapter` is now an alias for `KataGoONNXAdapter`.

  **New exports**:
  - `KataGoONNXAdapter` — ONNX-based adapter class
  - `KataGoBoard` — 19×19 board tracker with GTP move parsing
  - `encodePosition` / `decodePolicy` — KataGo ONNX input/output encoding
  - `createKataGoEngine(config)` — factory (model URL via `config.sources.main.url`)

  **Usage**:

  ```typescript
  const engine = createKataGoEngine({
    sources: { main: { url: "https://…/katago-b6c96.onnx" } },
  });
  await engine.load(); // downloads & compiles ONNX model via onnxruntime-web
  const result = await engine.search({ size: 19, komi: 6.5 });
  console.log(result.bestMove); // e.g. "D4"
  ```

  **registry**: katago entry updated — adapter changed from `gtp` to `katago`;
  model asset URL updated to `katago-b6c96.onnx` on GitHub Pages.

## 0.1.5

### Patch Changes

- Updated dependencies [6d81e23]
  - @multi-game-engines/registry@0.1.5
  - @multi-game-engines/adapter-gtp@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies [de4e000]
  - @multi-game-engines/registry@0.1.4
  - @multi-game-engines/adapter-gtp@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies [3fbbd7f]
  - @multi-game-engines/registry@0.1.3
  - @multi-game-engines/adapter-gtp@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [ba76c59]
  - @multi-game-engines/registry@0.1.2
  - @multi-game-engines/adapter-gtp@0.1.2

## 0.1.1

### Patch Changes

- df7cc78: # Initial Public Release: v0.1.0

  `@multi-game-engines` is a TypeScript-first, framework-agnostic library for loading and communicating with
  game AI engines in the browser, Node.js, and Bun — without bundling any GPL binaries.

  ## Architecture
  - **`@multi-game-engines/core`**: Protocol-agnostic `EngineBridge` and `EngineLoader` with SRI integrity
    enforcement, OPFS persistence, AbortSignal support, and resume-capable loading.
  - **`@multi-game-engines/registry`**: Engine registry (`engines.json`) containing URL metadata only —
    no binaries bundled (ADR-014 license isolation).

  ## Adapters

  Protocol adapters communicate with engines via their native protocols:
  - **UCI** (`adapter-uci`, `adapter-stockfish`): Chess engines — Stockfish 16 with SIMD / no-SIMD / single-thread variants, all with verified SHA-384 SRI hashes.
  - **USI** (`adapter-usi`, `adapter-yaneuraou`): Shogi engines — Yaneuraou 7.5.
  - **GTP** (`adapter-gtp`, `adapter-katago`): Go engines — KataGo 1.14.
  - **Edax** (`adapter-edax`): Reversi — Edax 4.4.
  - **GNU Backgammon** (`adapter-gnubg`): Backgammon — gnubg 1.06.
  - **KingsRow** (`adapter-kingsrow`): Checkers — KingsRow 1.61.
  - **Mortal** (`adapter-mortal`): Mahjong — Mortal 1.0.
  - **Xiangqi / Janggi** (`adapter-xiangqi`, `adapter-janggi`): Chinese Chess and Korean Chess.
  - **Ensemble** (`adapter-ensemble`): Multi-engine voting / consensus adapter.

  ## Domain Packages

  Typed position representations and move validation for Chess, Shogi, Go, Reversi, Backgammon,
  Checkers, Gomoku, Mahjong, Xiangqi, and Janggi.

  ## UI Packages

  Framework adapters for React, Vue 3, and Web Components (Lit/Elements):
  - `ui-core`: Framework-agnostic reactive engine state, NPS scaling, and analysis pipeline.
  - `ui-react` / `ui-vue` / `ui-elements`: Base hooks, composables, and custom elements.
  - `ui-react-core` / `ui-vue-core`: Engine lifecycle management.
  - `ui-react-monitor` / `ui-vue-monitor`: Real-time analysis monitoring widgets.
  - `ui-chess` / `ui-chess-react` / `ui-chess-vue` / `ui-chess-elements`: Chess board components.
  - `ui-shogi` / `ui-shogi-react` / `ui-shogi-vue` / `ui-shogi-elements`: Shogi board components.

  ## i18n Packages

  Federated i18n architecture with Zero-Any type safety:
  `i18n-core`, `i18n-common`, `i18n-chess`, `i18n-shogi`, `i18n-engines`, `i18n-dashboard`.

  ## Security
  - **SRI Enforcement**: All engine assets loaded with SHA-384 integrity checks. `__unsafeNoSRI`
    flag auto-blocks in `NODE_ENV=production` (throws `SECURITY_ERROR`).
  - **"Refuse by Exception" policy**: Security gate is closed by default; explicitly opened per-asset.
  - **Zero GPL contamination**: All `@multi-game-engines/*` packages are MIT. Engine binaries are
    loaded at runtime from CDN or user-provided URLs — never bundled.

- Updated dependencies [df7cc78]
  - @multi-game-engines/adapter-gtp@0.1.1
  - @multi-game-engines/core@0.1.1
  - @multi-game-engines/registry@0.1.1
