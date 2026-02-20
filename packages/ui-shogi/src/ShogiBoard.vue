<script setup lang="ts">
import "./elements.js";
import { Move } from "@multi-game-engines/core";
import { SFEN } from "@multi-game-engines/core/shogi";
import { ShogiPiece } from "@multi-game-engines/ui-core/shogi";

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
