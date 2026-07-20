---
"@multi-game-engines/core": patch
---

Rebuild with the current toolchain so the published bundle picks up two fixes
that were already in the source tree but never shipped.

- **Module-init errors are no longer swallowed.** The bundler's lazy-ESM helper
  used to return `undefined` on every access after an initialization failure,
  hiding the original error. It now caches the failure and rethrows it, so a
  module that throws while initializing reports the real cause on each access.
- **The TypeScript build cache no longer ships.** `tsconfig.tsbuildinfo` was
  being included in the published tarball; the current build no longer emits it
  into `dist`.
