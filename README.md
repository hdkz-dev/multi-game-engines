# multi-game-engines

A flexible, decoupled bridge library for integrating various game engines (Chess, Shogi, etc.) into any JavaScript/TypeScript application.

## Overview

This project provides a plugin-based architecture to interface with different game engines. By separating the core logic from specific engine implementations, it ensures high reusability and clear license boundaries.

### Key Features

- **Decoupled Architecture**: The core library defines the interface; adapters handle specific engine logic.
- **Monorepo Structure**: Managed with npm workspaces for easy development and consistent versioning.
- **License-Friendly**: The core is MIT licensed, while engine adapters can follow the specific licenses of the engines they wrap (e.g., GPL for Stockfish).
- **Universal Support**: Designed to work with WebAssembly (WASM), native binaries, or remote server-based engines.

## Project Structure

```text
/
├── packages/
│   ├── core/              # Core bridge logic and Type definitions (MIT)
│   └── adapter-stockfish/ # Stockfish implementation (GPL)
├── examples/              # Usage examples
└── ARCHITECTURE.md        # Detailed design documentation
```

## Getting Started

*(Work in Progress)*

## License

- Core Bridge: MIT
- Adapters: Depends on the underlying engine (see individual package READMEs)
