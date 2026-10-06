# @multi-game-engines/adapter-katago

Go engine adapter using ONNX Runtime Web. `KataGoONNXAdapter` runs policy/value inference in the browser. `KataGoAdapter` is a deprecated compatibility alias.

## Model and deployment status (2026-10-06)

The registry currently points to a deterministic stub ONNX model with random weights. Its Pages URL returns HTTP 200 and has registered SRI, but it does not provide production KataGo playing strength. Real-model integration requires a compatible converted model, licence review, and inference validation. The build workflow can retrieve a model through `KATAGO_ONNX_URL`; that repository secret is not currently registered.

## Features

- **ONNX inference**: Position encoding and policy decoding with ONNX Runtime Web.
- **Resource integrity**: Model loading uses the engine resource-loading contract and configured SRI.

## Usage

```typescript
import { EngineBridge } from "@multi-game-engines/core";
import { KataGoONNXAdapter } from "@multi-game-engines/adapter-katago";

const bridge = new EngineBridge();
const adapter = new KataGoONNXAdapter();
await bridge.registerAdapter(adapter);
```

Registration is separate from loading a configured model. See the [maintenance plan](../../docs/en/implementation_plans/20261006-maintenance-and-roadmap.md) for production-model prerequisites.
