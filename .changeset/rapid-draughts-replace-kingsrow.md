---
"@multi-game-engines/adapter-kingsrow": minor
"@multi-game-engines/registry": patch
---

Replace blocked KingsRow with rapid-draughts for English Draughts (Checkers)

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
