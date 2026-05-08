---
"@multi-game-engines/core": minor
---

Add `ChunkedDownloader` — HTTP Range request based chunked download for large WASM/eval files (Zenith Loader).

- Splits downloads ≥ 32 MiB into 4 MiB chunks via `Range: bytes=X-Y`
- Falls back to single `fetch` when server does not support Range requests
- SRI verification (sha256/sha384/sha512) for full buffer and per-segment (`ISegmentedSRI`)
- Integrates with `IFileStorage` for OPFS/IndexedDB caching
- Progress reporting via `ProgressCallback` throughout download lifecycle
- AbortSignal support for cancellation
- `EngineLoader.loadResource` routes to `ChunkedDownloader` when `config.size >= 32 MiB`
