---
"@multi-game-engines/core": minor
---

Add Multi-Runtime Bridge: `resolveRuntime()`, `isNodeEnvironment()`, `ICommunicator` interface, and `RuntimeConfig` type.

`resolveRuntime(config)` automatically selects `NativeCommunicator` (Node.js, native binary via stdin/stdout) or `WorkerCommunicator` (browser, Web Worker) based on the detected runtime. `BaseAdapter.communicator` is now typed as `ICommunicator | null` to support both communicator kinds.
