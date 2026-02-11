# Technical Specifications (TECHNICAL_SPECS.md)

## 1. Core Type System

### 1-1. Branded Types
Domain-specific strings are protected using Branded Types to prevent accidental mixing.
```typescript
type FEN = string & { readonly __brand: "FEN" };
type Move = string & { readonly __brand: "Move" };
```

### 1-2. Search Info
```typescript
interface IBaseSearchInfo {
  depth: number;
  score: number; // centipawns or mate (scaled by 10000)
  pv?: Move[];
  nps?: number;
  time?: number;
}
```

## 2. Engine Facade (IEngine)

The primary API for end-users.
- `load()`: Initializes with SRI verification and cache lookup.
- `search(options)`: Asynchronous search task. Middleware is applied **sequentially**. Rejects if aborted.
- `onInfo(callback)`: Subscription for real-time thinking progress. Delivers middleware-processed data.

## 3. Infrastructure & Security

### 3-1. EngineLoader
- **SRI Enforcement**: Mandatory validation for all resources.
- **Dynamic MIME Types**: Sets correct content types (e.g., `application/wasm`) based on `config.type` for maximum compatibility.
- **OPFS Caching**: High-speed binary persistence.

### 3-2. WorkerCommunicator
- **Message Buffering**: Prevents race conditions by temporarily storing unhandled messages, ensuring early responses from fast WASM engines are never missed.
- **Timeouts**: Automated aborting of protocol initialization.
- **Exception Propagation**: Captures Worker-level crashes as `EngineError`.

## 4. Middleware Pipeline (ADR-020, ADR-023)

Processes data during `onCommand`, `onInfo`, and `onResult` phases.
- **Sequential Execution**: Uses `for...of` loops to guarantee data transformation order and pipeline purity.
- **Priority Order**: Executes based on `MiddlewarePriority`.

## 5. Error Management (EngineError)

- `WASM_INIT_FAILED`: Failed to load/instantiate WASM.
- `SRI_MISMATCH`: Resource integrity check failed.
- `SEARCH_TIMEOUT`: Aborted or timed out.
- `NETWORK_ERROR`: Connection failure (includes HTTP status).
