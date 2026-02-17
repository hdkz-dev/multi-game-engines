<script setup lang="ts">
import "@multi-game-engines/ui-elements";

interface ChessBoardProps {
  fen: string;
  lastMove?: string;
  orientation?: "white" | "black";
}

interface ShogiBoardProps {
  sfen: string;
  lastMove?: string;
}

defineProps<{
  type: "chess" | "shogi";
  fen?: string;
  sfen?: string;
  lastMove?: string;
  orientation?: "white" | "black";
}>();
</script>

<template>
  <chess-board
    v-if="type === 'chess'"
    :fen="fen"
    :last-move="lastMove"
    :orientation="orientation"
  ></chess-board>
  <shogi-board
    v-else-if="type === 'shogi'"
    :sfen="sfen"
    :last-move="lastMove"
  ></shogi-board>
</template>
