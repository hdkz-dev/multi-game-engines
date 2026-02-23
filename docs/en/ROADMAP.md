# Roadmap (ROADMAP.md)

## 🏁 Phase 1: Foundation (Completed)

- Core Bridge Logic (`EngineBridge`, `EngineFacade`)
- Worker Communication Layer (`WorkerCommunicator`)
- Basic Security (`SRI`, `Injection Protection`)
- Storage Foundation (`OPFS`, `IndexedDB`)

## 🚀 Phase 2: Multi-Game Ecosystem (Current)

- Support for Chess (Stockfish), Shogi (Yaneuraou), Go (KataGo), Reversi (Edax), and Mahjong (Mortal).
- Cross-framework UI Components (React, Vue, Web Components).
- **Zenith Tier Refinement (PR #38)**:
  - **Standardization (ADR-046)**: Uniform directory structure and naming conventions across monorepo.
  - **Security (Handshake Protocol)**: Standardized resource injection in Workers (ADR-043).
  - **Observability (Privacy-First Logging)**: Safe telemetry with `truncateLog` (ADR-038).

## 🔥 Phase 3: Ultimate Optimization (Upcoming)

- **Swarm Intelligence**: Advanced `EnsembleAdapter` strategies.
- **Hardware Acceleration**: Universal WebNN and WebGPU bindings for all engines.
- **Mobile Native Bridge**: Direct interop with iOS/Android native engine binaries.
- **Incomplete Information Engines**: Support for Poker and Bridge protocols.
