# ADR-055: Standardization of Piece Visualization through pieceSymbols property

## Status
Accepted (2026-03-01)

## Context
In multi-game-engines, piece visualization was previously tied to the `pieceNames` property, which served both as the visual text/label and the accessibility (ARIA) description. This coupling made it difficult to:
1. Use distinct visual symbols (e.g., Unicode chess characters ♟♞♝) while maintaining clear text-based accessibility labels (e.g., "Pawn", "Knight").
2. Allow theme-specific visual character overrides without affecting screen reader output.

## Decision
We introduce a dedicated `pieceSymbols` property to all board components (`ChessBoard`, `ShogiBoard` in elements, React, and Vue wrappers).

1. **Separation of Concerns**:
   - `pieceNames`: Used for accessibility (ARIA labels, titles). Defaults to localized strings from the i18n package.
   - `pieceSymbols`: Used for visual rendering inside the board cells and hand area. Defaults to the value of `pieceNames` if not specified.
2. **Technical Implementation**:
   - Web Components: Added `@property({ type: Object }) pieceSymbols`.
   - React/Vue Wrappers: Forward `pieceSymbols` prop to the underlying custom element via `ref`.
   - Rendering Logic: `pieceSymbol = customPieceSymbols[type] || customPieceNames[type] || localizedDefault[type]`.

## Consequences
- **Positive**: Enhanced flexibility for UI customization. Better support for high-quality piece symbols without compromising accessibility.
- **Positive**: In alignment with WCAG 2.2 color/symbol independence principles.
- **Neutral**: Slightly increased prop surface area for board components.
