# Implementation Plan: Zenith Hybrid Dashboard & Board Components

## 1. Goal

Provide a complete, functional prototype of the Zenith Hybrid Dashboard by implementing framework-agnostic Board components (Chess/Shogi) and integrating them with the existing Engine Bridge infrastructure.

## 2. Architecture

The board components will be implemented as Web Components (Lit) in `@multi-game-engines/ui-elements` to ensure maximum reusability across React, Vue, and vanilla environments.

### 2.1. Board Components (`ui-elements`)

- `<chess-board>`:
  - Property: `fen` (string) - Current position.
  - Property: `last-move` (string) - LAN move to highlight (e.g., "e2e4").
  - Property: `orientation` ("white" | "black").
- `<shogi-board>`:
  - Property: `sfen` (string) - Current position.
  - Property: `last-move` (string) - USI move to highlight (e.g., "7g7f").
  - Feature: Render captured pieces (Hand).

### 2.2. Piece Assets

- For Chess: Use standard SVG piece set (bundled as strings in the component).
- For Shogi: Use high-quality SVG characters or Kanji rendering.

### 2.3. Framework Integration

- `@multi-game-engines/ui-react`: Export `ChessBoard` and `ShogiBoard` React wrappers.
- `@multi-game-engines/ui-vue`: Export `ChessBoard` and `ShogiBoard` Vue wrappers.

## 3. Dashboard Integration (`examples/zenith-dashboard`)

- Replace the `ChessGrid` / `ShogiGrid` placeholders with actual `<chess-board>` / `<shogi-board>`.
- Connect engine's best move output to the board's highlight property.
- Update `StatCard` to show real-time performance metrics (NPS, Nodes, Depth) obtained from `EngineMonitorPanel`'s shared state (if available) or via a new `useEngineStats` hook.

## 4. Technical Specifications

- **Performance**: Use CSS Grid for layout. SVG pieces for sharpness at any zoom level.
- **Accessibility**:
  - ARIA labels for the current turn and material balance.
  - Keyboard navigation to "focus" squares (optional for demo).
- **Zero-Any**: Strictly typed props using `FEN` and `SFEN` branded types.

## 5. Implementation Steps

1. [x] Add `parseFEN` / `parseSFEN` utilities to `packages/ui-core`.
2. [x] Implement `<chess-board>` in `packages/ui-elements`.
3. [x] Implement `<shogi-board>` in `packages/ui-elements`.
4. [ ] Add piece assets (SVG) to `packages/ui-core`.
5. [x] Create React/Vue wrappers.
6. [x] Update Zenith Dashboard demo.
7. [x] Add unit tests for board rendering logic (parsing FEN/SFEN into grid).
