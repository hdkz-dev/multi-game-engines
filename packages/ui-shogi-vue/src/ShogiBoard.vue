<script setup lang="ts">
import "@multi-game-engines/ui-shogi-elements";
import { Move } from "@multi-game-engines/core";
import { SFEN, ShogiPiece } from "@multi-game-engines/domain-shogi";

defineProps<{
  sfen: SFEN;
  lastMove?: Move;
  boardLabel?: string;
  errorMessage?: string;
  handSenteLabel?: string;
  handGoteLabel?: string;
  pieceNames?: Partial<Record<ShogiPiece, string>>;
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
