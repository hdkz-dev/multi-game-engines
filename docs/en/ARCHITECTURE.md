# Architecture & Design

This document explains the design principles and technical architecture of `multi-game-engines`.

## Design Principles

1.  **Framework Agnostic**:
    - The core library is built with pure TypeScript and standard Web APIs (AsyncIterable, EventTarget, etc.).
    - It works in any environment without depending on specific UI frameworks like React, Vue, or Angular.
2.  **Streaming I/O**:
    - Engine analysis (candidate moves, scores, etc.) is delivered using `AsyncIterable`. This allows for intuitive real-time updates using `for await...of` loops.
3.  **Modern Web Standards**:
    - **OPFS (Origin Private File System)**: Employs a high-speed browser-based filesystem for persisting large WASM and evaluation files (falls back to IndexedDB where unsupported).
    - **WebAssembly (SIMD/Threads)**: Supports configurations that maximize engine performance.

## Core Concepts

1.  **Bridge (Core)**: The orchestrator that manages engine lifecycles and provides a unified API.
2.  **Adapter Interface**: Strictly defined interfaces that all engine implementations must follow.
3.  **Engine Adapter**: Implementation layer that translates unified API calls into engine-specific commands (e.g., Chess UCI, Shogi USI).
4.  **Engine Loader**: Infrastructure layer that handles downloading external resources (WASM, etc.), SRI verification, and caching to OPFS transparently.
5.  **Worker Communicator**: Communication layer that abstracts type-safe messaging with WebWorkers.

## Plugin System

The `@multi-game-engines/core` package exports `IEngineAdapter` and `IEngine` interfaces, enabling anyone to create plugins.

### Extensibility

Provides a unified interface for common tasks (search, move, evaluation) while allowing access to engine-specific features. Adapters can expose specialized methods, and users can access them with type safety using TypeScript generics.

```typescript
// Type-safe access with engine-specific types
const stockfish = bridge.getEngine<StockfishOptions, StockfishInfo, StockfishResult>('stockfish');
stockfish.search({ fen: '...' as FEN, depth: 20 }); // Type-safe search
```

## License Strategy

- **Core**: MIT License. Contains no engine-specific code, making it usable in any project.
- **Adapters**: Each adapter is a separate npm package. This allows including engines like Stockfish (GPL) in the ecosystem without forcing GPL on the core library or the user's application (unless that specific adapter is explicitly used).

## Engine Loading Strategy

Balancing license isolation and user experience, we provide three strategies for loading engines (e.g., downloading WASM), giving developers full control:

1.  **Manual**:
    - Starts loading only after an explicit user action (e.g., clicking an "Install Engine" button).
    - Ideal for saving bandwidth or requiring license agreement.
2.  **On-demand / Fallback (Default)**:
    - Primarily manual, but automatically starts loading if an engine function (like search) is called while not ready.
    - Reduces user friction while preserving resources until needed.
3.  **Eager**:
    - Starts loading in the background immediately after application startup or adapter registration.
    - Provides a seamless experience without perceived wait times.

### Progress Visibility & I/O

In all strategies, adapters report detailed progress via `ILoadProgress`. This makes it easy for developers to implement:
- Management screens for installed engines.
- Progress bars during initial load.
- Engine-specific license agreement dialogs.

Engine binaries (WASM, etc.) are persisted using IndexedDB or OPFS in web contexts to speed up subsequent loads.
