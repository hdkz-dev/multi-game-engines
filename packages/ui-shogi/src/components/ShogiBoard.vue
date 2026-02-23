<script setup lang="ts">
import "../elements.js";
import { Move } from "@multi-game-engines/core";
import { SFEN, ShogiPiece } from "@multi-game-engines/domain-shogi";

defineProps<{
  sfen: SFEN;
  lastMove?: Move | undefined;
  boardLabel?: string | undefined;
  errorMessage?: string | undefined;
  handSenteLabel?: string | undefined;
  handGoteLabel?: string | undefined;
  pieceNames?: Partial<Record<ShogiPiece, string>> | undefined;
  locale?: string | undefined;
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
