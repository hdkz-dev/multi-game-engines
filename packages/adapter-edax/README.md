# @multi-game-engines/adapter-edax

Othello engine adapter for Edax 4.4.

## Protocols

- **Board/Move Protocol**: Standard Edax text protocol.

## Features

- **SRI Security**: Enforces hash verification for WASM binaries.
- **Worker Isolation**: Runs in a dedicated Web Worker.

## Usage

```typescript
import { EdaxAdapter } from "@multi-game-engines/adapter-edax";

const adapter = new EdaxAdapter();
await bridge.registerAdapter(adapter);
```
