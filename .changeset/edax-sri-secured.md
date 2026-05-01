---
"@multi-game-engines/registry": patch
---

Add SHA-384 SRI hash for Edax 4.4 WASM (Phase B2 complete for Reversi)

- Edax 4.4 `main` asset (`edax.js`) now has a real SHA-384 SRI hash
- Removes `__unsafeNoSRI: true` flag — Edax now loads securely in production
- WASM binary: abulmo/edax-reversi v4.4 (GPL-2.0-or-later), Emscripten ASYNCIFY build
- eval.dat (evaluation function) bundled via Emscripten `--preload-file` (~14MB)
- Build pipeline: `.github/workflows/build-wasm.yml` → artifacts deployed to GitHub Pages
