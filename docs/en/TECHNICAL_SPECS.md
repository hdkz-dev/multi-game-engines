# Technical Specifications

This document defines the technical foundation, design principles, and implementation details of the `multi-game-engines` project.

---

## 1. Architectural Principles

### 1.1 I/O Separation via Facade Pattern

Decouples the concrete engine implementation (Adapter) from the consumer API (Engine).

- **IEngine**: Minimal API required for game logic, such as starting/stopping analysis and receiving results.
- **IEngineAdapter**: Handles loading, resource management, low-level communication, and security verification.
  This allows users to control the engine with the same code, whether the adapter is WASM/Worker or a Native Plugin.

### 1.2 Domain Protection with Branded Types

Ensures semantic safety by avoiding reliance on primitive types like `string` or `number`.

- **FEN**: `string & { readonly __brand: "FEN" }`
- **Move**: `string & { readonly __brand: "Move" }`
  This prevents accidental passing of FENs or moves between different game engines, catchable 100% at compile time.

### 1.3 Mandatory Subresource Integrity (SRI)

Requires SRI hash verification when loading binaries from external CDNs to prevent tampering.

- The loader retrieves hashes from `manifest.json` and utilizes the browser's integrity check during fetch.

---

## 2. Communication and Data Flow (Unified Generics)

The project maintains a consistent generic order to represent engine characteristics:

1. `T_OPTIONS`: Search parameters (e.g., depth, time, multi-threading settings).
2. `T_INFO`: Sequential information sent during analysis (e.g., NPS, score, PV).
3. `T_RESULT`: Final search results (e.g., Best Move, Ponder).

---

## 3. Storage and Environment Diagnostics

### 3.1 CapabilityDetector

Diagnoses environment features (browser, app, etc.) at runtime to select the optimal adapter strategy.

- **OPFS (Origin Private File System)**: Prioritized for persisting large engine binaries and training data.
- **WASM SIMD/Threads**: Selects optimized binaries based on CPU instruction availability.
- **WebNN / WebGPU**: Detects future neural network (NNUE) acceleration support.

### 3.2 Fallback Strategy

Ensures a functional path in environments where modern APIs are unavailable.

- Missing OPFS → Fallback to IndexedDB.
- Custom CDN unreachable → Automatic switch to jsDelivr/unpkg.

---

## 4. Security and Isolation

### 4.1 Cross-Origin Isolation (COOP/COEP)

Diagnoses and requests proper HTTP header settings in the host environment to enable WASM multi-threading (SharedArrayBuffer).

### 4.2 Sandboxing via WebWorker

To physically prevent license infection (GPL/AGPL, etc.), engine executables are always run within WebWorkers (or native processes) isolated from the main thread.

---

## 5. Development Ecosystem

- **Monorepo (pnpm workspaces)**: Centralized dependency management and fast feedback cycles between packages.
- **Vitest**: High-speed unit testing.
- **TypeDoc**: Automatically generated developer documentation.
