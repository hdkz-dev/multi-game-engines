<script setup lang="ts">
import "@multi-game-engines/ui-elements";
import { Move } from "@multi-game-engines/core";
import { SFEN } from "@multi-game-engines/core/shogi";
import { ShogiPiece } from "@multi-game-engines/ui-core/shogi";

/**
 * React-like wrapper for the `<shogi-board>` Web Component in Vue.
 */
defineProps<{
  /** Validated Shogi SFEN string. */
  sfen: SFEN;
  /** Move to highlight (e.g., '7g7f'). */
  lastMove?: Move;
  /** Accessible label for screen readers. */
  boardLabel?: string;
  /** Error message to display when parsing fails. */
  errorMessage?: string;
  /** Custom label for Sente's captured pieces. */
  handSenteLabel?: string;
  /** Custom label for Gote's captured pieces. */
  handGoteLabel?: string;
  /** Custom piece names for accessibility (aria-labels). */
  pieceNames?: Partial<Record<ShogiPiece, string>>;
  /** Current locale for default labels. */
  locale?: string;
}>();
</script>

<template>
  <shogi-board
    :sfen="sfen"
    :last-move="lastMove"
    :board-label="boardLabel"
    :error-message="errorMessage"
    :hand-sente-label="handSenteLabel"
    :hand-gote-label="handGoteLabel"
    :locale="locale"
    .pieceNames="pieceNames"
  ></shogi-board>
</template>
