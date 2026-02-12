# Architecture & Design

This document explains the design principles and technical architecture of `multi-game-engines`.

## Design Principles

1.  **Pure Core (Pay-as-you-go)**:
    - The core library has zero knowledge of specific game engines or protocols.
    - Users only import the adapters they need, ensuring that unused code and types are never bundled.
2.  **Decentralized Type Inference (Declaration Merging)**:
    - Leverages TypeScript's declaration merging so that importing an adapter automatically enables type inference for `bridge.getEngine('id')`.
3.  **Framework Agnostic**:
    - Engine thinking information (candidate moves, scores) is delivered via `AsyncIterable`. This allows for intuitive real-time updates using `for await...of` loops.
3.  **Modern Web Standards (2026 Ready)**:
    - **OPFS (Origin Private File System)**: Used for high-speed browser-based file persistence of large WASM binaries and evaluation files (falls back to IndexedDB).
    - **WebAssembly (SIMD/Threads)**: Supports configurations that maximize engine performance.
    - **AbortSignal & ReadableStream**: Standardized cancellation and data streaming.

## Core Concepts

1.  **EngineBridge**: The orchestrator managing engine lifecycles, adapter registration, and global event monitoring.
2.  **EngineFacade**: The unified interface users interact with directly. It hides implementation details and handles sequential task management.
3.  **IEngineAdapter**: A strictly defined contract that all engine implementations must follow.
4.  **EngineLoader**: Infrastructure layer for secure resource fetching (SRI validation) and persistent caching.
5.  **WorkerCommunicator**: Abstraction for type-safe WebWorker communication with message buffering to prevent race conditions.

## Engine Loading Strategy

To optimize resource consumption and enhance user experience, the library provides three loading strategies:

1.  **manual**:
    - Resources are not fetched until `engine.load()` is explicitly called.
    - Ideal for saving bandwidth or deferring loading until after license agreement.
2.  **on-demand (Default)**:
    - Similar to manual, but if `search()` is executed before loading, it automatically starts the load and waits for completion.
    - The most convenient mode for developers, as it handles initialization transparently.
3.  **eager**:
    - Starts the background load immediately upon engine instance creation (`getEngine`).
    - Ensures the engine is ready before the user starts interacting, providing a zero-latency experience.

## Plugin System

Anyone can create a plugin by implementing the `IEngineAdapter` interface exported by `@multi-game-engines/core`.

### Extensibility

The system provides a unified interface for common tasks (search, moves, evaluation) while allowing access to engine-specific features via TypeScript generics.

```typescript
// Type-safe access to engine-specific features
const stockfish = bridge.getEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>('stockfish');
stockfish.search({ fen: '...' as FEN, depth: 20 });
```

### Multi-Protocol Support

Native support for **UCI (Universal Chess Interface)** and **USI (Universal Shogi Interface)** protocols. Each parser includes sanitization to prevent command injection.

## License Strategy

- **Core**: MIT License. Contains no engine-specific code.
- **Adapters**: Individual npm packages. This allows inclusion of GPL engines (like Stockfish/YaneuraOu) in the ecosystem without forcing GPL on the core library or user applications.

## Lifecycle & Resource Management

1.  **Persistent Listeners**: Event registrations like `onInfo` remain valid across consecutive search tasks.
2.  **Clean Disposal**: `bridge.dispose()` stops all active workers and completely releases memory and resources.
3.  **Proactive Memory Management (Blob URL)**: `EngineLoader` automatically tracks Blob URL lifecycles and provides "Auto-Revocation" to explicitly `revoke` old resources when the same engine is reloaded.
4.  **Security First**: SRI hash validation is mandatory for all external binaries. Supports W3C standard multi-hash formats.
5.  **Managed Subscriptions**: `EngineFacade` tracks all subscriptions to adapters and ensures they are cleared when the facade is disposed.
6.  **Modern Error Handling (Error Cause API)**: Low-level network and communication failures are wrapped in `EngineError` using the `Error Cause API` (2026 standard), preserving the original exception for advanced debugging.
