# Technical Specifications (TECHNICAL_SPECS.md)

## 1. Core Types

### 1-1. Branded Types
Used to protect domain-specific strings.
```typescript
type FEN = string & { readonly __brand: "FEN" };
type SFEN = string & { readonly __brand: "SFEN" };
type Move = string & { readonly __brand: "Move" };
```

### 1-2. Loading Strategy
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
- `dispose()`: Releases resources for an individual engine.

## 3. Security & Infrastructure

### 3-1. EngineLoader (Modern Security)
- **Mandatory SRI**: Force hash validation for all resources.
- **Dynamic MIME Types**: Identifies WASM (`application/wasm`) and JS (`application/javascript`).
- **30s Timeout**: Prevents network fetch hangs.

### 3-2. File Storage (2026 Best Practice)
- **Environment Adaptation**: Auto-switches between `OPFSStorage` (Fast) and `IndexedDBStorage`.
- **Robust Connections**: `IndexedDBStorage` implements auto-recovery from browser disconnects.
- **Exception Separation**: `OPFSStorage` treats `NotFoundError` as a normal cache miss.

### 3-3. WorkerCommunicator (Race-condition Free)
- **Message Buffering**: Processes messages even if they arrive before `expectMessage` is called.
- **Error Propagation**: Forwards internal Worker errors correctly.

## 4. Protocol Parsing

- **UCIParser**: For Chess. Supports `mate` score conversion (factor 10,000).
- **USIParser**: For Shogi. Supports time control and `mate` score conversion (factor 100,000).
- **Injection Protection**: Automatically removes illegal characters from FEN/SFEN.

## 5. Quality Assurance (Testing Philosophy)

- **74 Unit Tests**: 100% logic coverage.
- **Zero-Any Policy**: Forbidden usage of `any` across implementation and test code.
- **Lifecycle Validation**: Simulates real WebWorker communication and various loading strategies.
