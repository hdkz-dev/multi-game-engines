"use client";

import React from "react";
import "@multi-game-engines/ui-elements";

declare module "react" {
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
      };
      "shogi-board": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        sfen?: string | undefined;
        "last-move"?: string | undefined;
        class?: string | undefined;
      };
    }
  }
}

export interface ChessBoardProps {
  fen: string;
  lastMove?: string;
  orientation?: "white" | "black";
  className?: string;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  lastMove,
  orientation,
  className,
}) => {
  return (
    <chess-board
      fen={fen}
      last-move={lastMove}
      orientation={orientation}
      class={className}
    />
  );
};

export interface ShogiBoardProps {
  sfen: string;
  lastMove?: string;
  className?: string;
}

export const ShogiBoard: React.FC<ShogiBoardProps> = ({
  sfen,
  lastMove,
  className,
}) => {
  return <shogi-board sfen={sfen} last-move={lastMove} class={className} />;
};
