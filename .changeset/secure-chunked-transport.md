---
"@multi-game-engines/core": patch
---

Reject insecure or credential-bearing chunked download URLs before cache access. Use safe transport for HEAD, Range and GET, omit credentials and reject redirects; preserve abort and security refusals during HEAD fallback. Redirecting resource URLs must be replaced with their secure final URLs.
