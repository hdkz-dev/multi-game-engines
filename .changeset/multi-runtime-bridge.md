---
"@multi-game-engines/core": minor
"@multi-game-engines/adapter-uci": minor
"@multi-game-engines/adapter-usi": minor
"@multi-game-engines/adapter-gtp": minor
---

Add Multi-Runtime Bridge: `resolveRuntime()`, `isNodeEnvironment()`, `ICommunicator` interface, and `RuntimeConfig` type.

`resolveRuntime(config)` automatically selects `NativeCommunicator` (Node.js, native binary via stdin/stdout) or `WorkerCommunicator` (browser, Web Worker) based on the detected runtime. `BaseAdapter.communicator` is now typed as `ICommunicator | null` to support both communicator kinds.

`IEngineConfig` gains an optional `binaryPath` field. When set in a Node.js environment, the UCI/USI/GTP adapters bypass the `EngineLoader` and spawn a native binary process directly — no browser-specific loader required.
