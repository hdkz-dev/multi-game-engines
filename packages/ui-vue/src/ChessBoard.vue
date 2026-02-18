<script setup lang="ts">
import "@multi-game-engines/ui-elements";
import { FEN, Move, ChessPiece } from "@multi-game-engines/ui-core";

/**
 * React-like wrapper for the `<chess-board>` Web Component in Vue.
 */
defineProps<{
  /** Validated Chess FEN string. */
  fen: FEN;
  /** Move to highlight (e.g., 'e2e4'). */
  lastMove?: Move;
  /** Perspective: 'white' (default) or 'black'. */
  orientation?: "white" | "black";
  /** Accessible label for screen readers. */
  boardLabel?: string;
  /** Error message to display when parsing fails. */
  errorMessage?: string;
  /** Custom piece names for accessibility (aria-labels). */
  pieceNames?: Partial<Record<ChessPiece, string>>;
  /** Current locale for default labels. */
  locale?: string;
}>();
</script>

<template>
  <chess-board
    :fen="fen"
    :last-move="lastMove"
    :orientation="orientation"
    :board-label="boardLabel"
    :error-message="errorMessage"
    :locale="locale"
    .pieceNames="pieceNames"
  ></chess-board>
</template>
