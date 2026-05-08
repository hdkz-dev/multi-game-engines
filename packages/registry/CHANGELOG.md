# @multi-game-engines/registry

## 1.0.0

### Patch Changes

- Updated dependencies [[`d0b16c4`](https://github.com/hdkz-dev/multi-game-engines/commit/d0b16c4178ba32f485810ea3312126efb66c5c8d), [`c70ee30`](https://github.com/hdkz-dev/multi-game-engines/commit/c70ee30b229ef39fc860385014e709b86a4e56fd), [`665899e`](https://github.com/hdkz-dev/multi-game-engines/commit/665899e8cc68aa7674df19a2c9a7947f87f5b0db)]:
  - @multi-game-engines/core@0.2.0
  - @multi-game-engines/i18n-engines@0.1.1

## 0.1.6

### Patch Changes

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

- 14726e0: Replace blocked KingsRow with rapid-draughts for English Draughts (Checkers)

  KingsRow was a proprietary Windows-only DLL with no WASM compilation path.
  Replaced with rapid-draughts@1.0.6 (MIT, pure TypeScript).

  **Breaking change** (minor): `adapter-kingsrow` no longer requires a Web Worker
  or source URL. Call `createKingsRowAdapter()` / `createKingsRowEngine()` without
  passing `sources.main` — rapid-draughts is a bundled npm dependency.
  - `KingsRowAdapter.load()`: no loader argument needed; initialises instantly
  - `KingsRowAdapter.search({ board, depth? })`: calls `alphaBeta` directly
  - `KingsRowAdapter.applyMove("11-15")`: advance game state between moves
  - New exports: `RapidDraughtsAdapter` (alias), `RapidDraughtsParser` (alias),
    `createRapidDraughtsAdapter`, `createRapidDraughtsEngine`
  - `KingsRowParser` and all original export names remain for backward compat
  - `engines.json`: kingsrow entry updated to reflect rapid-draughts (v1.0, no CDN URL)

## 0.1.5

### Patch Changes

- 6d81e23: Phase B2: Add gnubg WASM Emscripten build pipeline + SRI hashes (GNU Backgammon live)
  - gnubg 1.05 `main` asset (`gnubg.js`) now has a real SHA-384 SRI hash
  - gnubg 1.05 `wasm` asset (`gnubg.wasm`) SRI hash committed
  - Removes `__unsafeNoSRI: true` — gnubg now loads securely in production
  - WASM binary: hwatheod/gnubg-web (gnubg v1.05.000 + glib 2.62.0, GPL-3.0)
  - Architecture: direct `_run_command()` export (no ASYNCIFY, simpler than Edax)
  - Data bundle: gnubg.wd neural net + gnubg_os0.bd bearoff DB + METs (~2MB)
  - Build pipeline: `.github/workflows/build-wasm.yml` → artifacts deployed to GitHub Pages

## 0.1.4

### Patch Changes

- de4e000: Add SHA-384 SRI hash for Edax 4.4 WASM (Phase B2 complete for Reversi)
  - Edax 4.4 `main` asset (`edax.js`) now has a real SHA-384 SRI hash
  - Removes `__unsafeNoSRI: true` flag — Edax now loads securely in production
  - WASM binary: abulmo/edax-reversi v4.4 (GPL-2.0-or-later), Emscripten ASYNCIFY build
  - eval.dat (evaluation function) bundled via Emscripten `--preload-file` (~14MB)
  - Build pipeline: `.github/workflows/build-wasm.yml` → artifacts deployed to GitHub Pages

## 0.1.3

### Patch Changes

- 3fbbd7f: Phase B2: Edax WASM Emscripten build pipeline + engine metadata cleanup
  - Add `_phase`, `_wasm_path`, `_note` metadata to all Phase B2 engines in engines.json
    - Edax 4.4: adds `wasm` + `evalData` placeholder assets (Emscripten build pending)
    - KataGo 1.14: notes ONNX Runtime Web approach, removes dead `wasm` asset
    - gnubg 1.06: adds `wasm` placeholder asset
    - KingsRow 1.61: marked `_phase: blocked` (proprietary, no WASM path)
    - Mortal 1.0: marked `_phase: blocked` (PyTorch-based, no direct WASM path)
  - Add `scripts/build-edax-wasm.sh` — Emscripten ASYNCIFY build for abulmo/edax-reversi v4.4.0
  - Add `scripts/edax-worker.js` — Worker entry point bridging postMessage ↔ Edax stdin/stdout
  - Add `.github/workflows/build-wasm.yml` — CI Emscripten build job (cached per version)
  - Update `docs.yml` — downloads Edax WASM artifact and stages it for GitHub Pages
  - Update `scripts/assets-manifest.json` v1.1 with Phase B2 research findings

## 0.1.2

### Patch Changes

- ba76c59: Add SHA-384 SRI hashes for やねうら王 7.5 WASM assets (Phase B1)
  - yaneuraou 7.5 main (yaneuraou.js) and wasm (yaneuraou.wasm) now have real SHA-384 hashes
  - Removes `__unsafeNoSRI: true` flags — engine now loads securely in production
  - Adds file sizes (main: 51312 B, wasm: 572743 B)
  - Removes simd variant entry (not separately available in mizar/YaneuraOu.wasm v7.5.0-alpha.4)
  - WASM binary: mizar/YaneuraOu.wasm v7.5.0-alpha.4 material variant (GPL-3.0)
    hosted at https://hdkz-dev.github.io/multi-game-engines/assets/yaneuraou/7.5/

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
  - @multi-game-engines/core@0.1.1
  - @multi-game-engines/i18n-engines@0.1.1
