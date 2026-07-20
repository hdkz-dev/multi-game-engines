---
"@multi-game-engines/adapter-bridge": patch
"@multi-game-engines/adapter-fairy-stockfish": patch
"@multi-game-engines/adapter-fairy-stockfish-shogi": patch
"@multi-game-engines/adapter-poker": patch
"@multi-game-engines/domain-bridge": patch
"@multi-game-engines/domain-poker": patch
"@multi-game-engines/i18n-chess": patch
"@multi-game-engines/i18n-common": patch
"@multi-game-engines/i18n-core": patch
"@multi-game-engines/i18n-dashboard": patch
"@multi-game-engines/i18n-engines": patch
"@multi-game-engines/i18n-shogi": patch
"@multi-game-engines/registry": patch
---

Ship the MIT license text with these packages.

All 53 published packages declare `"license": "MIT"` and list `LICENSE` in
their `files`, but 13 of them had no `LICENSE` file to include, so the
published tarballs carried the declaration without the license text itself.
The file is now present and byte-identical to the repository root license
across every published package.

No code or runtime behaviour changes.
