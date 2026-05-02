---
"@multi-game-engines/adapter-katago": minor
"@multi-game-engines/registry": patch
---

Replace GTP stub with ONNX Runtime Web adapter for KataGo (Phase B2)

The previous KataGoAdapter extended GTPAdapter and expected a proprietary
KataGo binary as a Web Worker. This is replaced by KataGoONNXAdapter —
a pure TypeScript adapter that runs KataGo's neural network via
onnxruntime-web, with no Worker or binary required.

**Breaking changes** (minor):

- `adapter-katago` no longer depends on `@multi-game-engines/adapter-gtp`
  or `@multi-game-engines/registry`. Remove those from your imports.
- `KataGoAdapter` is now an alias for `KataGoONNXAdapter`.

**New exports**:

- `KataGoONNXAdapter` — ONNX-based adapter class
- `KataGoBoard` — 19×19 board tracker with GTP move parsing
- `encodePosition` / `decodePolicy` — KataGo ONNX input/output encoding
- `createKataGoEngine(config)` — factory (model URL via `config.sources.main.url`)

**Usage**:

```typescript
const engine = createKataGoEngine({
  sources: { main: { url: "https://…/katago-b6c96.onnx" } },
});
await engine.load(); // downloads & compiles ONNX model via onnxruntime-web
const result = await engine.search({ size: 19, komi: 6.5 });
console.log(result.bestMove); // e.g. "D4"
```

**registry**: katago entry updated — adapter changed from `gtp` to `katago`;
model asset URL updated to `katago-b6c96.onnx` on GitHub Pages.
