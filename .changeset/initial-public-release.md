---
"@multi-game-engines/adapter-edax": patch
"@multi-game-engines/adapter-ensemble": patch
"@multi-game-engines/adapter-gnubg": patch
"@multi-game-engines/adapter-gtp": patch
"@multi-game-engines/adapter-janggi": patch
"@multi-game-engines/adapter-katago": patch
"@multi-game-engines/adapter-kingsrow": patch
"@multi-game-engines/adapter-mortal": patch
"@multi-game-engines/adapter-stockfish": patch
"@multi-game-engines/adapter-uci": patch
"@multi-game-engines/adapter-usi": patch
"@multi-game-engines/adapter-xiangqi": patch
"@multi-game-engines/adapter-yaneuraou": patch
"@multi-game-engines/core": patch
"@multi-game-engines/domain-backgammon": patch
"@multi-game-engines/domain-checkers": patch
"@multi-game-engines/domain-chess": patch
"@multi-game-engines/domain-go": patch
"@multi-game-engines/domain-gomoku": patch
"@multi-game-engines/domain-janggi": patch
"@multi-game-engines/domain-mahjong": patch
"@multi-game-engines/domain-reversi": patch
"@multi-game-engines/domain-shogi": patch
"@multi-game-engines/domain-xiangqi": patch
"@multi-game-engines/i18n-chess": patch
"@multi-game-engines/i18n-common": patch
"@multi-game-engines/i18n-core": patch
"@multi-game-engines/i18n-dashboard": patch
"@multi-game-engines/i18n-engines": patch
"@multi-game-engines/i18n-shogi": patch
"@multi-game-engines/registry": patch
"@multi-game-engines/ui-chess": patch
"@multi-game-engines/ui-chess-elements": patch
"@multi-game-engines/ui-chess-react": patch
"@multi-game-engines/ui-chess-vue": patch
"@multi-game-engines/ui-core": patch
"@multi-game-engines/ui-elements": patch
"@multi-game-engines/ui-react": patch
"@multi-game-engines/ui-react-core": patch
"@multi-game-engines/ui-react-monitor": patch
"@multi-game-engines/ui-shogi": patch
"@multi-game-engines/ui-shogi-elements": patch
"@multi-game-engines/ui-shogi-react": patch
"@multi-game-engines/ui-shogi-vue": patch
"@multi-game-engines/ui-vue": patch
"@multi-game-engines/ui-vue-core": patch
"@multi-game-engines/ui-vue-monitor": patch
---

# Initial Public Release: v0.1.0

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
