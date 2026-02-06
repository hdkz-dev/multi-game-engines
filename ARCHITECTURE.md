# Architecture & Design

This document describes the design principles and technical architecture of `multi-game-engines`.

## Core Concepts

The system is built on three main layers:

1.  **Bridge (Core)**: The orchestrator that manages engine lifecycles and provides a unified API.
2.  **Adapter Interface**: A strictly typed set of interfaces that every engine plugin must implement.
3.  **Engine Adapter**: The implementation layer that translates the unified API calls into engine-specific commands (e.g., UCI for Chess, USI for Shogi).

## Plugin System

To ensure that anyone can create a plugin, the `@multi-game-engines/core` package exports the `BaseAdapter` class and `IEngine` interface.

### Extensibility

While we provide a unified interface for common tasks (search, move, evaluate), we recognize that engines have unique capabilities. Adapters can expose engine-specific methods that users can access via type-safe generics:

```typescript
const stockfish = bridge.getEngine<StockfishAdapter>('stockfish');
stockfish.setSkillLevel(20); // Engine-specific method
```

## Licensing Strategy

- **Core**: MIT License. It contains no engine-specific code and can be used in any project.
- **Adapters**: Each adapter is a separate npm package. This allows us to include GPL-licensed engines like Stockfish in the ecosystem without forcing the GPL on the core library or the end-user's application (unless they choose to use that specific adapter).

## Engine Loading (WASM/Remote)

Adapters are responsible for how the engine is loaded. 
- **WASM**: The adapter package can include the `.wasm` file or fetch it from a CDN at runtime.
- **Worker**: Adapters should ideally run engines in a Web Worker to avoid blocking the main thread.
