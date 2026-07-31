---
"@multi-game-engines/registry": patch
---

Publish the refreshed gnubg SRI hash so npm consumers can load Backgammon.

The weekly WASM rebuild (2026-07-27) produced a new gnubg.wasm binary, and
refresh-sri updated `data/engines.json` on main via #235. That change never
reached npm on its own — the published `registry@1.1.2` still carried the
previous hash, so its integrity value no longer matched the deployed
`gnubg/1.05/gnubg.wasm` and the browser rejected the download under SRI,
making the GNU Backgammon engine unloadable for anyone resolving assets
through the published registry.

This is the same drift class as the `registry@1.1.0` gnubg mismatch fixed in
the earlier release; the underlying cause is that gnubg's Emscripten build is
non-deterministic, so each rebuild shifts the hash and the published registry
must be re-released to catch up.

Verified: the SRI in this release matches the byte-for-byte hash of the
currently deployed asset, and all 18 registry-tracked assets fetch 200 with
matching hashes.
