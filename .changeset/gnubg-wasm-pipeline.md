---
"@multi-game-engines/registry": patch
---

Phase B2: Add gnubg WASM Emscripten build pipeline + SRI hashes (GNU Backgammon live)

- gnubg 1.05 `main` asset (`gnubg.js`) now has a real SHA-384 SRI hash
- gnubg 1.05 `wasm` asset (`gnubg.wasm`) SRI hash committed
- Removes `__unsafeNoSRI: true` — gnubg now loads securely in production
- WASM binary: hwatheod/gnubg-web (gnubg v1.05.000 + glib 2.62.0, GPL-3.0)
- Architecture: direct `_run_command()` export (no ASYNCIFY, simpler than Edax)
- Data bundle: gnubg.wd neural net + gnubg_os0.bd bearoff DB + METs (~2MB)
- Build pipeline: `.github/workflows/build-wasm.yml` → artifacts deployed to GitHub Pages
