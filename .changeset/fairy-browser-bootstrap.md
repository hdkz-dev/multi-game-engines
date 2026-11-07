---
"@multi-game-engines/core": patch
"@multi-game-engines/adapter-uci": patch
"@multi-game-engines/adapter-usi": patch
"@multi-game-engines/adapter-fairy-stockfish": patch
"@multi-game-engines/adapter-fairy-stockfish-shogi": patch
"@multi-game-engines/registry": patch
---

Instantiate the verified Fairy-Stockfish Emscripten factory in a browser Worker, resolve its WASM and pthread assets from loader-verified Blob URLs, and retain protocol handshakes before declaring readiness. Preserve custom standalone Worker sources and native binary behavior. Fail explicitly when the browser cannot provide shared memory; terminate and release bootstrap resources on failure or disposal.

Wait for adapter shutdown before revoking verified resources, and reject in-flight searches when their browser Worker fails instead of leaving the result pending.

Cancel in-flight loading on disposal, preserve existing resource deadlines, and wait for shared cleanup completion so late loaders cannot leave a new Worker behind.
