---
name: wasm-optimizer
description: A skill for optimizing WebAssembly (Wasm) builds, specifically tailored for game engine adapters. Focuses on binary size reduction, loading performance, and integration with TypeScript/JavaScript.
version: 1.0.0
author: multi-game-engines contributors
---

# WebAssembly (Wasm) Optimizer Skill

This skill provides guidelines and tools for optimizing WebAssembly modules used in the project, particularly for game engine adapters (e.g., Stockfish).

## Capabilities

1.  **Size Optimization**: Strategies to minimize `.wasm` binary size (e.g., using `wasm-opt`, compiler flags).
2.  **Loading Performance**: Best practices for fetching, compiling, and instantiating Wasm modules (streaming compilation).
3.  **Memory Management**: Guidelines for managing Wasm memory from JavaScript/TypeScript to prevent leaks.
4.  **Integration**: Patterns for seamless communication between Wasm and the main JS thread or Web Workers.

## Optimization Checklist

- [ ] **Compiler Flags**: Are you using optimization flags like `-O3`, `-Oz`, or `-Os`?
- [ ] **Binary Stripping**: Have debug symbols been stripped from the production binary?
- [ ] **`wasm-opt`**: Is the binary post-processed with `wasm-opt` (from Binaryen)?
- [ ] **Streaming Compilation**: Do you use `WebAssembly.instantiateStreaming` where supported?
- [ ] **Compression**: Is the `.wasm` file served with Brotli or Gzip compression?

## Code Snippets

### Efficient Instantiation

```typescript
// Prefer instantiateStreaming for better performance
async function loadWasm(url: string, importObject: WebAssembly.Imports) {
  if (WebAssembly.instantiateStreaming) {
    return await WebAssembly.instantiateStreaming(fetch(url), importObject);
  } else {
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    return await WebAssembly.instantiate(bytes, importObject);
  }
}
```

## Tools

- **Emscripten**: Standard SDK for compiling C/C++ to Wasm.
- **Binaryen (`wasm-opt`)**: Compiler infrastructure and optimization toolchain.
- **Twiggy**: A code size profiler for Wasm.
- **wasm-snip**: Replaces unneeded Wasm functions with `unreachable`.

## Troubleshooting

- **"Out of bounds memory access"**: Check for correct pointer arithmetic and memory allocation sizes on the JS side.
- **"LinkError: Import #x module="env" function="...": function import requires a callable"**: Verify that the `importObject` passed to instantiation matches the imports expected by the Wasm module.
