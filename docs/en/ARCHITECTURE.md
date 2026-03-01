# Architecture & Design

This document explains the design principles and technical architecture of `multi-game-engines`.

## Design Principles

1.  **Pure Core (Pay-as-you-go)**:
    - The core library has zero knowledge of specific game engines or protocols.
    - **Domain Isolation**: Logic and localization resources (i18n) for specific games (Chess, Shogi, etc.) are physically isolated into dedicated packages (`domain-chess`, `i18n-chess`, etc.).
    - Users only import the modules they need, ensuring that unused code, types, and language data are never bundled.
2.  **Decentralized Type Inference (Declaration Merging)**:
    - Leverages TypeScript's declaration merging so that importing an adapter automatically enables type inference for `bridge.getEngine('id')`.
3.  **Framework Agnostic**:
    - Engine thinking information (candidate moves, scores) is delivered via `AsyncIterable`. This allows for intuitive real-time updates using `for await...of` loops.
4.  **Modern Web Standards (2026 Ready)**:
    - **OPFS (Origin Private File System)**: Used for high-speed browser-based file persistence of large WASM binaries and evaluation files (falls back to IndexedDB).
    - **WebAssembly (SIMD/Threads)**: Supports configurations that maximize engine performance.
    - **AbortSignal & ReadableStream**: Standardized cancellation and data streaming.

## Core Concepts

1.  **EngineBridge**: The orchestrator managing engine lifecycles, adapter registration, and global event monitoring.
2.  **EngineFacade**: The unified interface users interact with directly. It hides implementation details and handles sequential task management. **Middleware Isolation** ensures that failure in a single middleware (e.g., telemetry) does not interrupt the core engine process.
3.  **IEngineAdapter**: A strictly defined contract that all engine implementations must follow.
4.  **EngineLoader**: Infrastructure layer for secure resource fetching (SRI validation) and persistent caching. It implements byte-level verification to prevent corrupted data from being cached.
5.  **WorkerCommunicator**: Abstraction for type-safe WebWorker communication with message buffering to prevent race conditions.
6.  **NativeCommunicator**: Handles sub-process communication in Node.js environments. **Dynamic Stream Buffering** reassembles messages (like large PV strings) split across OS pipe packets.
7.  **ScoreNormalizer**: Standardizes disparate evaluation units (cp, mate, diff, winrate) into a unified `NormalizedScore` (-1.0 to 1.0) for consistent UI visualization.
8.  **EnvironmentDetector & ResourceGovernor**: Dynamically detects `SharedArrayBuffer` availability, RAM, and CPU cores to automatically apply optimal `Threads` and `Hash` settings.
9.  **Environment-Agnostic Storage**: Provides `NodeFSStorage` for local file system caching in CLI/Node.js, alongside browser OPFS/IndexedDB. Pluggable architecture allows for custom storage injection (e.g., Capacitor).
10. **Flow Control & AbortSignal**: Native support for `AbortSignal` in all asynchronous I/O and search processes, enabling immediate resource reclamation upon UI navigation or CLI cancellation.
11. **Zenith Quality (Zero-Any Architecture)**: 100% elimination of `any` in production code, strict TypeScript configuration, and **98.41% line coverage** ensured by empirical verification of edge cases (network failure, storage conflicts, circular references).

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

## Binary Variant Selection

Following 2026 Zenith Tier standards, the system automatically selects the best WASM binary based on physical capabilities (SIMD, Multi-threading).

- **Auto-Detection**: `EnvironmentDetector` verifies `SharedArrayBuffer` and SIMD support via bytecode validation.
- **Priority Order**: `simd-mt` > `simd` > `mt` > `st` (Single-thread).
- **Dynamic Fallback**: Automatically switches to single-threaded versions in environments lacking COOP/COEP headers to prevent crashes.

## Huge Asset Management

Dedicated layer for handling >100MB NNUE files and opening books.

- **Opening Book Provider**: Manages massive book data (.bin, .db) independently from engine binaries for cross-version reuse.
- **Segmented Integrity**: Downloads huge files in chunks with incremental SRI validation (`Segmented SRI`), enabling early detection of corruption.

## Plugin System

Anyone can create a plugin by implementing the `IEngineAdapter` interface exported by `@multi-game-engines/core`.

### Extensibility

The system provides a unified interface for common tasks (search, moves, evaluation) while allowing access to engine-specific features via TypeScript generics.

### Multi-Protocol Support

Native support for **UCI**, **USI**, **GTP**, **UCCI** (Xiangqi), **UJCI** (Janggi), **KingsRow** (Checkers), **GNUBG** (Backgammon), and custom JSON protocols.

### Multi-Engine Swarm Architecture

`EngineBridge` natively supports running multiple engines simultaneously.

- **Unique ID Management**: Distinct identification (e.g., `chess-sf-16`, `chess-lc0`) allows concurrent comparison and ensemble analysis.
- **Swarm Adapter**: A meta-adapter that aggregates multiple engines into a single `IEngine`.
  - **Expertise Mapping**: Weights moves based on engine "Capability Vectors" (e.g., tactics vs endgame).
  - **Consensus Algorithms**: Majority vote, weighted average, or expert prioritization.

- **Mock Engine**: Lightweight `MockAdapter` for CI/CD and frontend-first development without massive WASM assets.

## License Strategy

- **Core**: MIT License.
- **Adapters**: Individual npm packages to isolate copyleft (GPL) requirements from the core and user applications.

## Lifecycle & Resource Management

1.  **Persistent Listeners**: Event registrations remain valid across search tasks.
2.  **Clean Disposal**: `bridge.dispose()` completely releases all worker memory and resources.
3.  **Auto-Revocation**: `EngineLoader` automatically revokes old Blob URLs to prevent memory leaks during reloads.
4.  **Refuse by Exception**: Strict structural validation prevents command injection by rejecting (throwing on) illegal input rather than just sanitizing it.
5.  **Privacy-First Logging**: `truncateLog` automatically redacts sensitive position data from error logs (ADR-038).

## UI & Presentation Layer

High-performance, accessible UI foundation delivering engine results through a layered architecture.

1.  **Reactive Core (`ui-core`)**: Framework-agnostic logic, state management, and adaptive throttling.
2.  **Localization Layer (Federated i18n)**: Physically isolated, domain-optimized language packages with 100% Zero-Any type safety.
3.  **Framework Adapters**: Modular suites for React, Vue, and Web Components (Lit).

### Contract-driven UI

Zod schemas within `ui-core` validate all incoming engine data, preventing UI crashes from protocol deviations.

## AI Ensemble Development

Code quality and architectural integrity are maintained through mutual AI supervision (Gemini, CodeRabbit, DeepSource, Snyk).
