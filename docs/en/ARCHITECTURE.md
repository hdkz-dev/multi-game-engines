# Architecture & Design

This document describes the design principles and technical architecture of the `multi-game-engines` project.

## Design Principles

1.  **Framework Agnostic**:
    - The core library is built with pure TypeScript and standard Web APIs (AsyncIterable, AbortSignal, EventTarget).
    - It does not depend on any specific UI framework like React, Vue, or Angular, allowing it to run in any environment (Browser, Worker, Node.js).
2.  **Streaming I/O (Async Iterator)**:
    - Thinking progress from the engine (moves, evaluations) is delivered via `AsyncIterable`. This enables intuitive real-time updates using `for await...of` loops.
3.  **Modern Web Standards**:
    - **OPFS (Origin Private File System)**: High-speed browser file system for persisting large WASM and evaluation data files.
    - **SRI (Subresource Integrity)**: Mandatory integrity verification for all external resources.
    - **WebAssembly (SIMD/Threads)**: Native support for optimized engine binaries.

## Core Concepts

1.  **EngineBridge (Orchestrator)**: Manages engine lifecycle, adapter registry, and global middleware chains.
2.  **IEngine (Facade)**: The primary user-facing API that hides implementation details.
3.  **EngineAdapter**: The implementation layer that translates unified API calls into engine-specific protocols (e.g., UCI for Chess, USI for Shogi).
4.  **EngineLoader (Infrastructure)**: Handles resource downloading, SRI validation, and OPFS caching.
5.  **WorkerCommunicator**: Provides type-safe messaging with WebWorkers, including timeout and exception propagation.

## License Strategy

- **Core**: MIT License. Contains no engine-specific code.
- **Adapters**: Each adapter is a separate package with its own license. This allows including GPL-licensed engines (like Stockfish) in the ecosystem without forcing GPL on the core library or the user's application.

## Loading Strategy

To balance license isolation and user experience, we provide three strategies:

1.  **Manual**: Load starts only when the user explicitly triggers it (e.g., clicking an "Install" button).
2.  **On-demand (Default)**: Automatically triggers loading if an engine feature (like searching) is called before the engine is ready.
3.  **Eager**: Starts background loading immediately after application startup or adapter registration.

---

## Detailed Implementation: The Pipeline

When you call `engine.search()`, the following sequence occurs:

1.  **Command Pipeline**: Middleware processing of search options -> UCI command generation.
2.  **Task Management**: Automated stopping of any previous tasks (Mutual Exclusion).
3.  **Real-time Feedback**: `info` stream processing with middleware -> `onInfo` event delivery.
4.  **Final Result**: `bestmove` reception -> Result middleware -> Resolving the `search` Promise.
5.  **Interruption**: `AbortSignal` monitoring. If aborted, the Promise is immediately rejected and the engine task is stopped.
