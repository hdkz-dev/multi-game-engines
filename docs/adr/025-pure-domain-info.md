# ADR-025: Pure Domain Info - Separation of Core and Game-Specific Metrics

## Status

Proposed (2026-02-13)

## Context

Initially, `IBaseSearchInfo` in the `@multi-game-engines/core` package included `depth` and `score` as optional properties. While these are common in traditional board game engines (like Chess and Shogi), they are not universal. For example, some modern engines (like Go's KataGo or Mahjong's Mortal) use win rates, probabilities, or internal evaluation metrics that do not map directly to a single integer `score` or `depth`.

Maintaining these properties in the core created a "leaky abstraction" where game-specific concepts influenced the generic bridge design, leading to type casting and maintenance overhead when adding engines for non-traditional games.

## Decision

We will remove all game-specific properties from `IBaseSearchInfo`, `IBaseSearchOptions`, and `IBaseSearchResult` within the core package.

1.  **Core Minimal Interfaces**: Core will only provide infrastructure-related properties (e.g., `raw` for logging/debugging, `signal` for aborting tasks).
2.  **Adapter Responsibility**: Each adapter is responsible for defining its own domain-specific interfaces that extend the core base interfaces.
3.  **Type Safety via Generics**: The `IEngine` and `IEngineAdapter` interfaces will continue to use generics to ensure that the correct, domain-specific types are propagated from the adapter to the user-facing facade.

## Consequences

- **Positive**: The core package becomes truly generic and stable, independent of specific game types.
- **Positive**: Type safety is improved as users get precise types for each engine (e.g., `winrate` for Go, `isExact` for Reversi) without dealing with irrelevant properties.
- **Negative**: There is a slight increase in boilerplate for adapter developers as they must explicitly define properties like `depth` even if they are common across 80% of engines.
- **Neutral**: This change enforces a strict "Zero-Any Policy" as developers can no longer rely on optional properties in the base interface and must define correct domain types.
