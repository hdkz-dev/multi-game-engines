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
- `search(options)`: Asynchronous search task. Rejects if aborted.
- `onInfo(callback)`: Subscription for real-time thinking progress.

## 3. Infrastructure & Security

### 3-1. EngineLoader
- **SRI Enforcement**: Mandatory validation using `sha256-` or `sha384-` hashes for all resources.
- **OPFS Caching**: Persistent storage using `navigator.storage.getDirectory()`.
- **Blob Management**: Automatic `URL.revokeObjectURL()` after Worker initialization.

### 3-2. WorkerCommunicator
- **Timeouts**: Automated aborting of protocol initialization to prevent hanging.
- **Exception Propagation**: Captures Worker-level crashes as `EngineError` in the main thread.

## 4. Error Management (EngineError)

All critical failures are reported via the `EngineError` class.
- `WASM_INIT_FAILED`: Failed to load or instantiate WASM.
- `SRI_MISMATCH`: Resource integrity check failed.
- `SEARCH_TIMEOUT`: Aborted or timed out.
- `NETWORK_ERROR`: Connection or download failure.

## 5. Middleware Pipeline (ADR-020)

Processes data during `onCommand`, `onInfo`, and `onResult` phases.
- Executes in priority order (`MiddlewarePriority`).
- Supports asynchronous middleware.
