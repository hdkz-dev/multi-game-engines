/**
 * edax-worker.js — Web Worker entry point for Edax WASM
 *
 * This file is the Worker that the EdaxAdapter loads. It wraps the
 * Emscripten-compiled edax.module.js and bridges the postMessage API to
 * Edax's stdin/stdout using Emscripten's ASYNCIFY mechanism.
 *
 * Protocol (same as Edax CLI over stdin/stdout):
 *   Parent → Worker  : plain text commands, e.g. "go" / "quit" / "setboard ..."
 *   Worker → Parent  : plain text responses, e.g. "info depth 10 score 12 pv e6"
 *                      and "move f5"
 *
 * ASYNCIFY note: emcc was built with -sASYNCIFY=1, which instruments the WASM
 * bytecode so blocking C reads (fgetc/fgets) can suspend execution and resume
 * when new input arrives. Module.stdin() uses Asyncify.handleSleep() for this.
 *
 * Source: abulmo/edax-reversi v4.4 (GPL-2.0-or-later)
 * Built by: scripts/build-edax-wasm.sh
 */
"use strict";

// ── stdin queue ───────────────────────────────────────────────────────────────
// Characters waiting to be consumed by the WASM module's blocking reads.
const stdinQueue = [];
/** @type {((charCode: number) => void) | null} */
let pendingWakeUp = null;

/**
 * Push a command string into the stdin queue and wake the WASM thread if it
 * is currently blocked waiting for input.
 * @param {string} text
 */
function feedInput(text) {
  const bytes = new TextEncoder().encode(text + "\n");
  for (const byte of bytes) {
    stdinQueue.push(byte);
  }
  if (pendingWakeUp !== null && stdinQueue.length > 0) {
    const wake = pendingWakeUp;
    pendingWakeUp = null;
    wake(stdinQueue.shift());
  }
}

// ── message handler ───────────────────────────────────────────────────────────
self.onmessage = (e) => {
  const msg = e.data;
  if (typeof msg === "string") {
    feedInput(msg);
  } else if (msg && typeof msg.cmd === "string") {
    feedInput(msg.cmd);
  }
};

// ── Emscripten Module ─────────────────────────────────────────────────────────
// edax.module.js is in the same directory and exposes createEdaxModule().
importScripts("./edax.module.js");

/** @type {import('./edax.module.js').EdaxModule} */
const Module = {
  /**
   * Emscripten stdout hook — forward each output line to the parent context
   * so the EdaxAdapter can parse "info …" and "move …" lines.
   */
  print(line) {
    self.postMessage(line);
  },

  /** Suppress stderr (internal Edax diagnostics). */
  printErr() {},

  /**
   * Emscripten stdin hook with ASYNCIFY.
   *
   * When Edax C code calls fgetc(stdin) and no data is available, Emscripten
   * calls this function. We return the next queued byte immediately if available,
   * otherwise suspend WASM execution via Asyncify.handleSleep until feedInput()
   * is called from onmessage.
   *
   * @returns {number} character code, or result of Asyncify.handleSleep
   */
  stdin() {
    if (stdinQueue.length > 0) {
      return stdinQueue.shift();
    }
    // eslint-disable-next-line no-undef
    return Asyncify.handleSleep((wakeUp) => {
      pendingWakeUp = wakeUp;
    });
  },

  /** Keep the Module alive after main() returns (Edax runs its own event loop). */
  noExitRuntime: true,
};

// ── Boot ──────────────────────────────────────────────────────────────────────
createEdaxModule(Module).then(() => {
  // Signal to the parent that the engine loaded and is ready for commands.
  self.postMessage("Edax 4.4 (WASM/ASYNCIFY) — ready");
});
