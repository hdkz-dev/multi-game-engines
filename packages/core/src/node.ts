/**
 * `@multi-game-engines/core/node`
 *
 * Node.js-only entry point.  Import this subpath when building adapters that
 * run in Node.js (CLI tools, desktop apps, server-side analysis pipelines).
 *
 * The Node.js package condition selects this native implementation. Browser
 * and other default resolvers receive a separate safe entry: worker selection
 * remains available, while native process construction fails explicitly.
 *
 * @example
 * ```typescript
 * import { NativeCommunicator, resolveRuntime } from "@multi-game-engines/core/node";
 *
 * const comm = resolveRuntime({ binaryPath: "/usr/bin/stockfish" });
 * if (comm instanceof NativeCommunicator) await comm.spawn();
 * ```
 */

export type { ICommunicator } from "./workers/ICommunicator.js";
export { NativeCommunicator } from "./workers/NativeCommunicator.js";
export { resolveRuntime, isNodeEnvironment } from "./workers/resolveRuntime.js";
export type { RuntimeConfig } from "./workers/resolveRuntime.js";
