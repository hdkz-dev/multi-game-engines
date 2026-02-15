# Technical Specifications (TECHNICAL_SPECS.md)

## 1. Core Types

The Core package provides only abstract definitions independent of specific games or protocols.

### 1-1. Abstract Foundation

- **Brand<T, K>**: Common helper for creating Branded Types.
- **EngineStatus**: Lifecycle states of an engine.
- **EngineErrorCode**: Standardized error codes.

### 1-2. Domain Extension via Adapters

Game-specific types (e.g., `FEN`, `SFEN`, `Move`) are defined within their respective adapter packages to maintain core purity.

```typescript
/** Examples of types defined by adapters */
type FEN = Brand<string, "FEN">;
type SFEN = Brand<string, "SFEN">;
```

### 1-3. Loading Strategy

- `manual`: Requires explicit `load()` call.
- `on-demand`: Auto-loads if not ready when `search()` is called.
- `eager`: Starts loading immediately upon engine creation.

## 2. Engine Facade (IEngine)

The main API for consumers.

- `load()`: Initialization with SRI validation and cache loading.
- `search(options)`: Asynchronous search. Handles auto-loading based on strategy. Sequential middleware application.
- `onInfo(callback)`: Subscription to real-time thinking stream.
- `loadingStrategy`: Dynamic strategy switching.
- `stop()`: Safely aborts the current search.
- `dispose()`: Releases resources for an individual engine. Automatically unbinds all subscriptions to adapters (Managed Subscriptions).

## 3. Security & Infrastructure

### 3-1. EngineLoader (Modern Security)

- **Mandatory SRI**: Force hash validation for all resources. Supports W3C standard multi-hash (space-separated) formats.
- **Dynamic MIME Types**: Identifies WASM (`application/wasm`) and JS (`application/javascript`).
- **Auto-Revocation**: Proactively `revoke` old Blob URLs on re-load to prevent memory leaks.
- **30s Timeout**: Prevents network fetch hangs. Advanced error tracking via `Error Cause API`.

### 3-2. File Storage (2026 Best Practice)

- **Environment Adaptation**: Auto-switches between `OPFSStorage` (Fast) and `IndexedDBStorage`.
- **Robust Connections**: `IndexedDBStorage` implements auto-recovery from browser disconnects.
- **Exception Separation**: `OPFSStorage` treats `NotFoundError` as a normal cache miss.

### 3-3. WorkerCommunicator (Race-condition Free)

- **Message Buffering**: Processes messages even if they arrive before `expectMessage` is called.
- **Error Propagation**: Correctly forwards internal Worker errors and rejects pending tasks on `terminate()`.

## 4. Protocol Parsing

- **UCIParser**: For Chess. Supports `mate` score conversion (factor 10,000).
- **USIParser**: For Shogi. Supports time control, `mate` score conversion (factor 100,000), and special handling for the `startpos` keyword.
- **Injection Protection**: Automatically removes illegal characters from FEN/SFEN.

## 5. Quality Assurance (Testing Philosophy)

- **107 Unit Tests**: 100% logic and edge-case coverage.
- **Zero-Any Policy**: Forbidden usage of `any` across implementation and test code.
- **Lifecycle Validation**: Simulates real WebWorker communication and various loading strategies.
