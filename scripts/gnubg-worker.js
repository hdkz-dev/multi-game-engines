"use strict";
/**
 * gnubg-worker.js — Web Worker entry point for GNU Backgammon WASM
 *
 * Architecture (different from Edax/ASYNCIFY):
 *   gnubg-web exports _run_command() as a direct C function call.
 *   No blocking stdin reads → no ASYNCIFY needed.
 *
 *   postMessage(string) → _run_command(buf) → Module.print → postMessage
 *
 * Loaded by GNUBGAdapter via WorkerCommunicator.
 * gnubg.module.js + gnubg.module.wasm + gnubg.module.data must live
 * in the same directory (Emscripten auto-fetches wasm + data).
 */

// Output buffer — gnubg can produce multiple print() calls per command;
// collect them all and flush after _run_command returns.
const outputLines = [];
let gnubgModule = null;

importScripts("./gnubg.module.js");

/** Flush accumulated print lines to the main thread. */
function flushOutput() {
  for (const line of outputLines) {
    self.postMessage(line);
  }
  outputLines.length = 0;
}

const moduleConfig = {
  /** Capture gnubg's stdout lines. */
  print(line) {
    outputLines.push(line);
  },

  /** Suppress stderr noise (gnubg logs warnings on stderr). */
  printErr() {},

  noExitRuntime: true,
};

createGnubgModule(moduleConfig)
  .then((mod) => {
    gnubgModule = mod;

    // Drain any output produced during module initialisation (gnubg prints
    // its banner and loads neural nets during main()).
    flushOutput();

    self.postMessage("gnubg 1.05 (WASM) — ready");
  })
  .catch((err) => {
    self.postMessage("ERROR: gnubg WASM init failed: " + String(err));
  });

self.onmessage = (e) => {
  const cmd =
    typeof e.data === "string"
      ? e.data
      : e.data && typeof e.data.cmd === "string"
        ? e.data.cmd
        : null;

  if (cmd === null || cmd === undefined) return;

  if (!gnubgModule) {
    // Module still initialising — drop or queue; GNUBGAdapter retries after ready.
    return;
  }

  // Allocate a null-terminated C string for the command.
  const buf = gnubgModule.allocateUTF8(cmd);
  try {
    gnubgModule._run_command(buf);
  } finally {
    gnubgModule._free(buf);
  }

  // Flush all print() output produced by this command invocation.
  flushOutput();
};
