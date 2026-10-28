---
"@multi-game-engines/core": minor
---

Require a valid full-resource SRI for direct ChunkedDownloader calls and revalidate stored resources before exposing them. Callers must now pass `{ sri }`; segmented hashes supplement the required full hash. Download options add `maxBytes` (512 MiB by default), Range responses must exactly match requested intervals, and completion is emitted only after integrity checks. `cacheKey()` now returns a Promise of a fixed-length SHA-256 identity of the complete URL and SRI; existing cache entries are ignored and fetched again.
