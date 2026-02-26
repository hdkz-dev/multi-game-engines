# Roadmap (ROADMAP.md)

## 🏁 Phase 1: Foundation (Completed)

- Core Bridge Logic (`EngineBridge`, `EngineFacade`)
- Worker Communication Layer (`WorkerCommunicator`)
- Basic Security (`SRI`, `Injection Protection`)
- Storage Foundation (`OPFS`, `IndexedDB`)

## 🚀 Phase 2: Multi-Game Ecosystem (Completed)

- Support for Chess (Stockfish), Shogi (Yaneuraou), Go (KataGo), Reversi (Edax), and Mahjong (Mortal).
- Cross-framework UI Components (React, Vue, Web Components).
- **Zenith Tier Refinement**:
  - **Standardization (ADR-046)**: Uniform directory structure across the monorepo.
  - **Security (ADR-043)**: Reliable resource injection via handshake.
  - **Observability (ADR-038)**: Privacy-first logging with `truncateLog`.

## 🔥 Phase 3: Ultimate Optimization (Current)

- **Modular i18n (Pay-as-you-go)**: Physical package separation and Zero-Any type safety (Federated i18n Architecture).
- **Engine Registry**: Pluggable metadata resolution chain (ADR-047).
- **Swarm Intelligence**: Advanced `EnsembleAdapter` strategies.
- **Hardware Acceleration**: Universal WebNN and WebGPU bindings.
- **Mobile Native Bridge**: Direct interop with native engine binaries.
