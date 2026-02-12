# Architecture & Design

This document explains the design principles and technical architecture of `multi-game-engines`.

## Design Principles

1.  **Framework Agnostic**:
    - The core library is built with pure TypeScript and standard Web APIs (AsyncIterable, EventTarget, etc.).
    - It does not depend on any specific UI framework like React, Vue, or Angular.
2.  **Streaming I/O**:
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
3.  **Security First**: SRI hash validation is mandatory for all external binaries. Tampered resources are blocked before execution.
