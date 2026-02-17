<script setup lang="ts">
import "@multi-game-engines/ui-elements";
import { FEN, SFEN } from "@multi-game-engines/ui-core";

/**
 * 汎用的な盤面コンポーネント。
 * チェスまたは将棋の Web Components をラップして提供します。
 */
defineProps<{
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
</script>

<template>
  <!-- 2026 Best Practice: テンプレート側でフォールバック値を明示し、カスタムエレメントへの null 渡しを防止 -->
  <chess-board
    v-if="type === 'chess'"
    :fen="fen ?? ''"
    :last-move="lastMove ?? ''"
    :orientation="orientation ?? 'white'"
    :board-label="boardLabel"
  ></chess-board>
  <shogi-board
    v-else-if="type === 'shogi'"
    :sfen="sfen ?? ''"
    :last-move="lastMove ?? ''"
    :board-label="boardLabel"
    :hand-sente-label="handSenteLabel"
    :hand-gote-label="handGoteLabel"
  ></shogi-board>
</template>
