import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    node: "src/node.ts",
    "mocks/index": "src/mocks/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  // Splitting disabled so that dist/index.js (browser-safe) and dist/node.js
  // (Node.js-only) each get a self-contained bundle.  With splitting enabled,
  // tsup merges WorkerCommunicator and NativeCommunicator into the same shared
  // chunk, which causes browser bundlers to see the node:child_process import
  // even when they only consume dist/index.js.
  splitting: false,
  sourcemap: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
  tsconfig: "tsconfig.build.json",
});
