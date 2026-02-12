# Technical Specifications (TECHNICAL_SPECS.md)

## 1. Core Types

### 1-1. Branded Types
Used to protect domain-specific strings.
```typescript
type FEN = string & { readonly __brand: "FEN" };
type SFEN = string & { readonly __brand: "SFEN" };
type Move = string & { readonly __brand: "Move" };
```

## 2. Engine Facade (IEngine)

The main API for consumers.
- `load()`: Initialization with SRI validation and cache loading.
- `search(options)`: Asynchronous search. Sequential middleware application. Previous tasks are auto-aborted when a new one starts.
- `onInfo(callback)`: Subscription to real-time thinking stream. Delivers middleware-processed data.
- `stop()`: Safely aborts the current search.
- `dispose()`: Releases resources for an individual engine.

## 3. Security & Infrastructure

### 3-1. EngineLoader (Modern Security)
- **Mandatory SRI**: Force hash validation for all resources. Empty SRI is treated as an error.
- **Dynamic MIME Types**: Correctly identifies WASM (`application/wasm`) and JS (`application/javascript`).
- **30s Timeout**: Prevents network fetch hangs.

### 3-2. File Storage (2026 Best Practice)
- **Environment Adaptation**: Auto-switches between `OPFSStorage` (Fast) and `IndexedDBStorage` (General).
- **Robust Connections**: `IndexedDBStorage` implements lifecycle management to auto-recover from browser disconnects or version updates.
- **Exception Separation**: `OPFSStorage` treats `NotFoundError` as a normal cache miss, distinct from other I/O errors.

### 3-3. WorkerCommunicator (Race-condition Free)
- **Message Buffering**: Processes messages even if they arrive before `expectMessage` is called.
- **Error Propagation**: Forwards internal Worker errors as Promise Rejections to the main thread.

## 4. Protocol Parsing

- **UCIParser**: For Chess. Supports `mate` score conversion (factor 10,000).
- **USIParser**: For Shogi. Supports `btime`, `wtime`, `byoyomi` time control. Supports `mate` score conversion (factor 100,000).
- **Injection Protection**: Automatically removes illegal characters (newlines, semicolons, etc.) from FEN/SFEN.

## 5. Quality Assurance (Testing Philosophy)

- **70 Unit Tests**: 100% logic coverage.
- **Zero-Any Policy**: Forbidden usage of `any` across implementation and test code.
- **Lifecycle Validation**: Simulates real WebWorker communication from load to disposal.
