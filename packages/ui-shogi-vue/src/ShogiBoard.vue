<script setup lang="ts">
import "@multi-game-engines/ui-shogi-elements";
import { Move } from "@multi-game-engines/core";
import { SFEN, ShogiPiece } from "@multi-game-engines/domain-shogi";

defineProps<{
  sfen: SFEN;
  lastMove?: Move | undefined;
  boardLabel?: string | undefined;
  errorMessage?: string | undefined;
  handSenteLabel?: string | undefined;
  handGoteLabel?: string | undefined;
  handPieceCount?: string | undefined;
  pieceNames?: Partial<Record<ShogiPiece, string>> | undefined;
  pieceSymbols?: Partial<Record<ShogiPiece, string>> | undefined;
  locale?: string | undefined;
}>();
</script>

<template>
  <shogi-board
    :sfen="sfen"
    :last-move="lastMove || undefined"
    :board-label="boardLabel"
    :error-message="errorMessage"
    :hand-sente-label="handSenteLabel"
    :hand-gote-label="handGoteLabel"
    :hand-piece-count="handPieceCount"
    :locale="locale"
    .pieceNames="pieceNames"
    .pieceSymbols="pieceSymbols"
  ></shogi-board>
</template>
