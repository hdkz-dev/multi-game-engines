---
"@multi-game-engines/registry": patch
---

Phase B2: Edax WASM Emscripten build pipeline + engine metadata cleanup

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
