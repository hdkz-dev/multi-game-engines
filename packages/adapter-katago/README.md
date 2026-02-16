# @multi-game-engines/adapter-katago

Go engine adapter for KataGo (GTP).

## Protocols

- **GTP (Go Text Protocol)**: Supports `genmove`, `loadboard`, `komi` etc.

## Features

- **SRI Security**: Enforces hash verification for WASM binaries and weights.
- **Strict Parsing**: Regex-based output validation.

## Usage

```typescript
import { KataGoAdapter } from "@multi-game-engines/adapter-katago";

const adapter = new KataGoAdapter();
await bridge.registerAdapter(adapter);
```
