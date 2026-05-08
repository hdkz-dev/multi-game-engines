# @multi-game-engines/core

## 0.2.0

### Minor Changes

- [`d0b16c4`](https://github.com/hdkz-dev/multi-game-engines/commit/d0b16c4178ba32f485810ea3312126efb66c5c8d) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - Add Multi-Runtime Bridge: `resolveRuntime()`, `isNodeEnvironment()`, `ICommunicator` interface, and `RuntimeConfig` type.

  `resolveRuntime(config)` automatically selects `NativeCommunicator` (Node.js, native binary via stdin/stdout) or `WorkerCommunicator` (browser, Web Worker) based on the detected runtime. `BaseAdapter.communicator` is now typed as `ICommunicator | null` to support both communicator kinds.

  `IEngineConfig` gains an optional `binaryPath` field. When set in a Node.js environment, the UCI/USI/GTP adapters bypass the `EngineLoader` and spawn a native binary process directly — no browser-specific loader required.

- [`c70ee30`](https://github.com/hdkz-dev/multi-game-engines/commit/c70ee30b229ef39fc860385014e709b86a4e56fd) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - Add `OtelBridge` — optional OpenTelemetry integration adapter

  Bridges `ITelemetryEvent` from `engine.onTelemetry()` to OpenTelemetry spans
  without requiring `@opentelemetry/api` as a hard dependency:
  - `OtelBridge.fromGlobal()` — dynamically imports `@opentelemetry/api` only if installed; returns `null` otherwise (zero-install-cost for users who don't use OTel)
  - `OtelBridge.record(event)` — maps performance / lifecycle / search events to named OTel spans with engine-scoped attributes
  - `OtelBridge.asCallback()` — returns a callback ready to pass to `engine.onTelemetry()`
  - `IOtelTracer` / `IOtelSpan` minimal interfaces for structural compatibility without the full OTel SDK
  - `@opentelemetry/api >=1.9.0` added as optional `peerDependency`

- [`665899e`](https://github.com/hdkz-dev/multi-game-engines/commit/665899e8cc68aa7674df19a2c9a7947f87f5b0db) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - Add `ChunkedDownloader` — HTTP Range request based chunked download for large WASM/eval files (Zenith Loader).
  - Splits downloads ≥ 32 MiB into 4 MiB chunks via `Range: bytes=X-Y`
  - Falls back to single `fetch` when server does not support Range requests
  - SRI verification (sha256/sha384/sha512) for full buffer and per-segment (`ISegmentedSRI`)
  - Integrates with `IFileStorage` for OPFS/IndexedDB caching
  - Progress reporting via `ProgressCallback` throughout download lifecycle
  - AbortSignal support for cancellation
  - `EngineLoader.loadResource` routes to `ChunkedDownloader` when `config.size >= 32 MiB`

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
