# @multi-game-engines/adapter-mortal

Mahjong engine adapter for Mortal (JSON Protocol).

## Protocols

- **JSON Protocol**: Structured messaging for complex game states.

## Features

- **Recursive Validation**: Zod-like deep object scanning for injection prevention.
- **Exception Safety**: Robust JSON parsing that withstands malformed inputs.

## Usage

```typescript
import { MortalAdapter } from "@multi-game-engines/adapter-mortal";

const adapter = new MortalAdapter();
await bridge.registerAdapter(adapter);
```
