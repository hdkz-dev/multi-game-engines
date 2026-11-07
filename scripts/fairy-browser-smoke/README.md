# Real Fairy-Stockfish browser smoke

Build the SDK packages first, then run from the repository root:

```sh
pnpm build
pnpm --filter @examples/zenith-dashboard-react exec playwright install chromium
node scripts/fairy-browser-smoke/run.mjs
```

The runner uses the existing workspace esbuild and Playwright installations, starts an isolated Portless proxy and HTTP fixture, and opens `http://registry.localhost:1356`. It cleans up its browser, server, proxy and temporary state on success, failure and cancellation. It never changes the shared Portless state or host configuration. An occupied proxy port is an error; set `FAIRY_SMOKE_PORT` explicitly when running concurrently. `PLAYWRIGHT_BROWSERS_PATH` is respected. `FAIRY_SMOKE_REPORT` selects the JSON evidence output; its default is `artifacts/fairy-browser/report.json`, printed on success.

The fixture serves COOP `same-origin`, COEP `require-corp`, and CSP permitting only its own script, verified Blob workers/WASM, and registry CDN fetches. It calls each default factory without source overrides, supplies consent, loads the real registry assets through the real EngineLoader/SRI checks, searches the orthodox starting position at depth 1, validates the best move against all legal initial moves, and disposes. The isolated UCI/USI positive cases and the unisolated UCI negative case each use a fresh browser context and a 45-second execution bound. Actual `uciok`/`usiok` and `bestmove` messages are required; no UI mock or local fallback is available. Page/worker/network errors fail the run. A snapshot immediately after awaited dispose must already show every observed root worker terminated and every Blob URL revoked; delayed polling cannot turn premature disposal into a pass. Nested pthread lifetime is covered by module shutdown behavior rather than direct instrumentation.

Network access to the registry CDN is necessary. A network or integrity failure is a failed smoke run, never a skipped success. This is a real asset smoke check, not a substitute for unit tests of all failure branches, all browser engines, all variants, or legal moves after the initial position.

The third case serves the page without COOP/COEP and requires an explicit cross-origin-isolation/SharedArrayBuffer capability failure before Worker creation. The report retains `ok: false` and only records `intentionalCapabilityRejection: true` after validating the failure reason, absence of Worker messages/fallback, and awaited cleanup of all four downloaded Blob assets. Unrelated load/network/integrity failures do not satisfy this negative case. The published `fairy-stockfish-nnue.wasm@1.1.11` tarball contains only `stockfish.js`, `stockfish.worker.js`, `stockfish.wasm`, `uci.js`, and `package.json`; the factory requires shared WASM memory, and this version ships no single-thread alternative. This test does not add headers to consumer applications or silently change registry sources/SRI.
