---
"@multi-game-engines/registry": patch
---

Add SHA-384 SRI hashes for やねうら王 7.5 WASM assets (Phase B1)

- yaneuraou 7.5 main (yaneuraou.js) and wasm (yaneuraou.wasm) now have real SHA-384 hashes
- Removes `__unsafeNoSRI: true` flags — engine now loads securely in production
- Adds file sizes (main: 51312 B, wasm: 572743 B)
- Removes simd variant entry (not separately available in mizar/YaneuraOu.wasm v7.5.0-alpha.4)
- WASM binary: mizar/YaneuraOu.wasm v7.5.0-alpha.4 material variant (GPL-3.0)
  hosted at https://hdkz-dev.github.io/multi-game-engines/assets/yaneuraou/7.5/
