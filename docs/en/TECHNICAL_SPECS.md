# Technical Specifications

This document defines the technical foundation, design principles, and implementation details of the `multi-game-engines` project.

---

## 1. Architectural Principles

### 1.1 I/O Separation via Facade Pattern

Decouples the concrete engine implementation (Adapter) from the consumer API (Engine).

- **IEngine (Facade)**: The primary interface for users. Manages starting/stopping analysis, receiving results, middleware integration, and task mutual exclusion (automatic cleanup).
- **IEngineAdapter**: Responsible for loading, communication, and security verification. It executes commands via the `searchRaw` method after middleware processing.

### 1.2 Command and Streaming Integration

- **searchRaw(command)**: Accepts and executes raw protocol commands after they have been processed by the middleware chain.
- **AsyncIterable**: Engine analysis (info) is delivered via `AsyncIterable`, allowing for intuitive real-time updates using `for await...of` loops.

### 1.3 Domain Protection with Branded Types

Ensures semantic safety by avoiding reliance on primitive types like `string` or `number`.

- **FEN**: `string & { readonly __brand: "FEN" }`
- **Move**: `string & { readonly __brand: "Move" }`

---

## 2. Infrastructure Responsibilities

### 2.1 EngineLoader (Resource Management)

Handles resource acquisition from external CDNs transparently:
1. **SRI Verification**: Hash validation based on `manifest.json`.
2. **Persistent Caching**: Storing binaries in OPFS (Origin Private File System) or IndexedDB.
3. **Blob URL Generation**: Providing and revoking secure temporary URLs for Worker initialization.

### 2.2 WorkerCommunicator (Communication Abstraction)

Encapsulates WebWorker communication, providing type-safe messaging. It ensures that pending Promises are rejected if the Worker crashes, preventing application hangs.

---

## 3. Storage and Environment Diagnostics

### 3.1 CapabilityDetector

Universal diagnostic of environment features via `globalThis`:
- **OPFS**: Prioritized for large binary persistence.
- **WASM SIMD/Threads**: Binary selection based on CPU instruction availability.
- **WebNN / WebGPU**: Detection of machine learning acceleration support.

---

## 4. Security and Isolation

### 4.1 Sandboxing

To prevent license infection (GPL/AGPL, etc.), engine executables always run within WebWorkers isolated from the main thread. Adapters are provided under the MIT license and do not bundle the engine binaries.

---

## 5. Operations and Ecosystem

- **CI/CD**: Automated Lint, Build, and Test via GitHub Actions on every Pull Request.
- **Telemetry**: Centralized monitoring of statistics like `search_start`, `search_complete`, and `load_time` via `EngineBridge`.
