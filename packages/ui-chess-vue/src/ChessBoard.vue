<script setup lang="ts">
import "@multi-game-engines/ui-chess-elements";
import { Move } from "@multi-game-engines/core";
import { FEN, ChessPiece } from "@multi-game-engines/domain-chess";

defineProps<{
  fen: FEN;
  lastMove?: Move;
  orientation?: "white" | "black";
  boardLabel?: string;
  errorMessage?: string;
  pieceNames?: Partial<Record<ChessPiece, string>>;
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
