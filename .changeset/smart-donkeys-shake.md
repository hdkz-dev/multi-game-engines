---
"@multi-game-engines/registry": minor
---

Sync the bundled engine registry with the deployed assets.

The published `data/engines.json` had drifted from what is actually served,
which broke consumers in two ways:

- **Fairy-Stockfish engines were missing.** `adapter-fairy-stockfish` and
  `adapter-fairy-stockfish-shogi` are published, but the registry shipped no
  `fairy-stockfish` / `fairy-stockfish-shogi` entries, so those adapters could
  not resolve their assets through the official registry.
- **The gnubg SRI hash was stale.** The GNU Backgammon WASM binary was rebuilt
  and redeployed, so the pinned hash no longer matched the served file and SRI
  validation rejected the download, making the Backgammon engine unloadable.

Also pins confirmed SHA-384 hashes for the KataGo ONNX model and the Mortal
worker, replacing notes that described them as pending CI computation.
