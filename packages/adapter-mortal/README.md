# @multi-game-engines/adapter-mortal

Mahjong engine adapter for Mortal (JSON Protocol).

## Model and deployment status (2026-10-06)

The registry currently serves a rule-based stub Worker. Its Pages URL returns HTTP 200 and has registered SRI. The protocol integration is available, but the Worker does not run the real Mortal AI model. Production integration requires PyTorch-to-ONNX conversion and a compatible inference Worker. See the [maintenance plan](../../docs/en/implementation_plans/20261006-maintenance-and-roadmap.md).

## Protocols

- **JSON Protocol**: Structured messaging for complex game states.

## Features

- **Recursive Validation**: Zod-like deep object scanning for injection prevention.
- **Exception Safety**: Robust JSON parsing that withstands malformed inputs.

## Usage

```typescript
import { EngineBridge } from "@multi-game-engines/core";
import { MortalAdapter } from "@multi-game-engines/adapter-mortal";

const bridge = new EngineBridge();
const adapter = new MortalAdapter();
await bridge.registerAdapter(adapter);
```
