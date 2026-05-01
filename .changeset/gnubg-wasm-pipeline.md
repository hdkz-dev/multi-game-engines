---
"@multi-game-engines/registry": patch
---

Phase B2: Add gnubg WASM Emscripten build pipeline (GNU Backgammon)

- `scripts/build-gnubg-wasm.sh`: Emscripten build via hwatheod/gnubg-web recipe
  - gnubg v1.05.000 + glib 2.62.0 compiled to WASM
  - Direct `_run_command()` export — no ASYNCIFY needed (synchronous C calls)
  - `--preload-file packaged_files@/`: bundles gnubg.wd + bearoff DBs + METs (~2MB)
  - Post-build `getpwuid` stub patch (Emscripten issue #13219)
- `scripts/gnubg-worker.js`: Web Worker using `Module._run_command()` directly
  - No blocking stdin / no ASYNCIFY — simpler than Edax
  - Multi-line output buffering: collects all `print()` calls per command
- `.github/workflows/build-wasm.yml`: new `build-gnubg` job
  - Caches source, WASM output separately
  - Uploads artifact `gnubg-wasm-v1.05`
- `.github/workflows/docs.yml`: downloads `gnubg-wasm-v1.05` artifact and stages
  under `assets/gnubg/1.05/` on GitHub Pages
- `engines.json`: gnubg updated to version 1.05 (hwatheod build), SRI TBD
