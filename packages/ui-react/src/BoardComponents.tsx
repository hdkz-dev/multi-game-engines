"use client";

import React from "react";
import "@multi-game-engines/ui-elements";
import { FEN, SFEN } from "@multi-game-engines/ui-core";

declare module "react/jsx-runtime" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "chess-board": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        fen?: string | undefined;
        "last-move"?: string | undefined;
        orientation?: "white" | "black" | undefined;
        class?: string | undefined;
        "board-label"?: string | undefined;
      };
      "shogi-board": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        sfen?: string | undefined;
        "last-move"?: string | undefined;
        class?: string | undefined;
        "board-label"?: string | undefined;
        "hand-sente-label"?: string | undefined;
        "hand-gote-label"?: string | undefined;
      };
    }
  }
}

export interface ChessBoardProps {
  fen: FEN;
  lastMove?: string;
  orientation?: "white" | "black";
  className?: string;
  boardLabel?: string;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  lastMove,
  orientation,
  className,
  boardLabel,
}) => {
  return (
    <chess-board
      fen={fen}
      last-move={lastMove}
      orientation={orientation}
      class={className}
      board-label={boardLabel}
    />
  );
};

export interface ShogiBoardProps {
  sfen: SFEN;
  lastMove?: string;
  className?: string;
  boardLabel?: string;
  handSenteLabel?: string;
  handGoteLabel?: string;
}

export const ShogiBoard: React.FC<ShogiBoardProps> = ({
  sfen,
  lastMove,
  className,
  boardLabel,
  handSenteLabel,
  handGoteLabel,
}) => {
  return (
    <shogi-board
      sfen={sfen}
      last-move={lastMove}
      class={className}
      board-label={boardLabel}
      hand-sente-label={handSenteLabel}
      hand-gote-label={handGoteLabel}
    />
  );
};
