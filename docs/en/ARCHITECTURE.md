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
4.  **Modern Web Standards (2026 Ready)**:
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
import { IChessSearchOptions } from "@multi-game-engines/adapter-stockfish";
import { createFEN } from "@multi-game-engines/core";

const stockfish = bridge.getEngine("stockfish");
// Type is automatically inferred via EngineRegistry if adapter is imported
stockfish.search({
  fen: createFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
  depth: 20,
});
```

### Multi-Protocol & Multi-Game Support

Native support for **UCI (Universal Chess Interface)**, **USI (Universal Shogi Interface)**, **GTP (Go Text Protocol)**, **Reversi**, and custom JSON protocols (e.g., Mahjong). Each parser includes strict injection validation.

## License Strategy

- **Core**: MIT License. Contains no engine-specific code.
- **Adapters**: Individual npm packages. This allows inclusion of GPL engines (like Stockfish/YaneuraOu) in the ecosystem without forcing GPL on the core library or user applications.

## Lifecycle & Resource Management

1.  **Persistent Listeners**: Event registrations like `onInfo` remain valid across consecutive search tasks.
2.  **Clean Disposal**: `bridge.dispose()` stops all active workers and completely releases memory and resources.
3.  **Proactive Memory Management (Blob URL)**: `EngineLoader` automatically tracks Blob URL lifecycles and provides "Auto-Revocation" to explicitly `revoke` old resources when the same engine is reloaded.
4.  **Security First (SRI & Integrity)**: SRI hash validation is mandatory for all external binaries. Supports W3C standard multi-hash formats.
5.  **Strict Input Validation**: To prevent protocol-level command injection, we use "Refuse by Exception" instead of sanitization. Inputs with illegal control characters are blocked before reaching the engine.
6.  **Modern Error Handling (Error Cause API)**: Low-level failures are wrapped in `EngineError` using the `Error Cause API`, with `remediation` fields providing actionable recovery guidance for developers.
7.  **WASM & Binary Strategy**:
    - **Blob URL Constraints**: Fetching additional resources (.wasm, .nnue) via relative paths inside Workers is prohibited due to Blob Origin opacity.
    - **Dependency Injection**: Adapters must load binaries via `EngineLoader` and inject Blob URLs during Worker initialization.

## UI & Presentation Layer

The project provides a high-performance, accessible UI foundation for delivering engine results to users.

### 1. Layered Architecture

To avoid framework lock-in and support 2026 standards, the UI layer is separated into:

1.  **Reactive Core (`ui-core`)**: Framework-agnostic business logic, state management, and requestAnimationFrame (RAF)-based throttling for high-frequency updates.
    - **Generic State Support**: `SearchMonitor` and `createInitialState` now support custom state types via generics, allowing applications to extend the base engine state while maintaining 100% type safety and eliminating unsafe casts.
2.  **Localization Layer (`i18n`)**: Pure language resources and type-safe interfaces.
3.  **Framework Adapters (Modular Split)**:
    - **`ui-*-core`**: Foundation for each framework (i18n Provider, basic UI context).
    - **`ui-*-monitor`**: Engine monitoring and management tools (`EngineMonitorPanel` and its sub-components).
    - **`ui-*-game`**: Game-specific UI components (e.g., `ChessBoard`).
    - **`ui-react` / `ui-vue`**: Hub packages that integrate and export all modular components. Users can choose to install only what they need (e.g., just `ui-chess-react`) for minimum dependencies.
    - **`ui-elements`**: Lit-based Web Components for ultimate portability.

### 2. Contract-driven UI

Data reaching the UI layer is validated at runtime using Zod schemas within `ui-core`, preventing crashes due to protocol mismatches.

### 3. Board Rendering & Position Analysis

The system provides features to visualize engine thinking processes through board rendering.

- **Position Parsers**: FEN (Chess) and SFEN (Shogi) parsers in `ui-core` convert engine strings into renderable grid arrays and hand objects.
- **Reusable Board Components**: `<chess-board>` and `<shogi-board>` components in `ui-elements` leverage CSS Grid for efficient rendering.
- **Accessibility & i18n**: All pieces include `aria-label` localized via the `pieceNames` property.
- **Optimization (Code Splitting)**: UI components and hooks support subpath exports (e.g., `@multi-game-engines/ui-react/hooks`) for optimal bundle sizes.
- **Real-time Sync**: Automatic highlighting of the current best move on the board synchronized with engine state.

## AI Ensemble Development

Code quality and architectural integrity are maintained through an "AI Ensemble" where multiple AI tools monitor and complement each other.

1.  **Mutual Review Protocol**: Design (Gemini) ⇔ Audit (CodeRabbit) checks suppress hallucinations.
2.  **Multi-layer Guardrails**: Logical audits (CodeRabbit), Static analysis (DeepSource), and Security scanning (Snyk).
3.  **Self-Healing Specs**: AI automatically regenerates API documentation and Mermaid.js diagrams to prevent drift between implementation and docs.
