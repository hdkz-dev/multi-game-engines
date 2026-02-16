# @multi-game-engines/adapter-yaneuraou

Shogi engine adapter for YaneuraOu 7.5.0 (USI).

## Protocols

- **USI (Universal Shogi Interface)**: Full support including `mate` score conversion.

## Features

- **WASM**: High-performance WebAssembly build.
- **USI Parsing**: Specialized parser for Shogi specific commands.

## Usage

```typescript
import { YaneuraOuAdapter } from "@multi-game-engines/adapter-yaneuraou";

const adapter = new YaneuraOuAdapter();
await bridge.registerAdapter(adapter);
```
