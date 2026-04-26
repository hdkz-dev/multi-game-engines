<script setup lang="ts">
import "../elements.js";
import { Move } from "@multi-game-engines/core";
import { FEN } from "@multi-game-engines/domain-chess";
import { ChessPiece } from "@multi-game-engines/domain-chess";

defineProps<{
  fen: FEN;
  lastMove?: Move | undefined;
  orientation?: "white" | "black" | undefined;
  boardLabel?: string | undefined;
  errorMessage?: string | undefined;
  pieceNames?: Partial<Record<ChessPiece, string>> | undefined;
  locale?: string | undefined;
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
