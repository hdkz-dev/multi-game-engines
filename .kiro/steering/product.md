# Product Definition: multi-game-engines

## Mission

To build loosely coupled, high-performance game engine bridges with modern Web standards and maximum type safety, ensuring a strictly isolated environment that eliminates licensing concerns for users.

## Core Values

- **Loose Coupling**: Clean separation between core logic and engine-specific adapters.
- **Type Safety**: Use of Branded Types and strict generic ordering.
- **Security First**: Robust SRI validation and protection against command injection.
- **Zero-Any Policy**: Absolute avoidance of `any` in implementation and tests.

## Key Features

- Facade pattern implementation (`IEngine` interface).
- Multi-engine support (Stockfish, Yaneuraou, KataGo, Edax, Mortal).
- Unified UCI/USI/GTP/JSON protocol handling.
- Integrated security auditing and telemetry.
