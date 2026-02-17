<script setup lang="ts">
import "@multi-game-engines/ui-elements";
import { FEN, SFEN } from "@multi-game-engines/ui-core";

/**
 * 汎用的な盤面コンポーネント。
 * チェスまたは将棋の Web Components をラップして提供します。
 */
const props = defineProps<{
  /** ゲーム種別 */
  type: "chess" | "shogi";
  /** チェス局面 (FEN) */
  fen?: FEN;
  /** 将棋局面 (SFEN) */
  sfen?: SFEN;
  /** ハイライトする指し手 (LAN/USI) */
  lastMove?: string;
  /** 盤面の向き (チェス用) */
  orientation?: "white" | "black";
  /** 盤面のアクセシビリティラベル */
  boardLabel?: string;
  /** 駒台のラベル (将棋・先手) */
  handSenteLabel?: string;
  /** 駒台のラベル (将棋・後手) */
  handGoteLabel?: string;
}>();

if (props.type === "chess" && !props.fen) {
  console.warn("[BoardComponents] 'fen' is required when type is 'chess'");
} else if (props.type === "shogi" && !props.sfen) {
  console.warn("[BoardComponents] 'sfen' is required when type is 'shogi'");
}
</script>

<template>
  <!-- 2026 Best Practice: 未定義時は属性をバインドせず、Web Component 側のデフォルト値を優先させる -->
  <chess-board
    v-if="type === 'chess'"
    :fen="fen"
    :last-move="lastMove"
    :orientation="orientation"
    :board-label="boardLabel"
  ></chess-board>
  <shogi-board
    v-else-if="type === 'shogi'"
    :sfen="sfen"
    :last-move="lastMove"
    :board-label="boardLabel"
    :hand-sente-label="handSenteLabel"
    :hand-gote-label="handGoteLabel"
  ></shogi-board>
</template>
