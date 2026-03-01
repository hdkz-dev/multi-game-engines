import React from "react";
import { ChessBoard as ChessBoardElement } from "./elements.js";

import { Move } from "@multi-game-engines/core";
import { FEN } from "@multi-game-engines/domain-chess";
import { ChessPiece } from "@multi-game-engines/domain-chess";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "chess-board": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        fen?: FEN | undefined;
        "last-move"?: Move | undefined;
        orientation?: "white" | "black" | undefined;
        class?: string | undefined;
        "board-label"?: string | undefined;
        "error-message"?: string | undefined;
        pieceNames?: Partial<Record<ChessPiece, string>> | undefined;
        pieceSymbols?: Partial<Record<ChessPiece, string>> | undefined;
        ref?: React.Ref<ChessBoardElement> | undefined;
      };
    }
  }
}

export interface ChessBoardProps {
  fen: FEN;
  lastMove?: Move;
  orientation?: "white" | "black";
  className?: string;
  boardLabel?: string;
  errorMessage?: string;
  pieceNames?: Partial<Record<ChessPiece, string>>;
  pieceSymbols?: Partial<Record<ChessPiece, string>>;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  lastMove,
  orientation,
  className,
  boardLabel,
  errorMessage,
  pieceNames,
  pieceSymbols,
}: ChessBoardProps) => {
  const ref = React.useRef<ChessBoardElement>(null);

  React.useLayoutEffect(() => {
    if (ref.current) {
      ref.current.pieceNames = pieceNames ?? {};
      ref.current.pieceSymbols = pieceSymbols ?? {};
    }
  }, [pieceNames, pieceSymbols]);

  return (
    <chess-board
      ref={ref}
      fen={fen}
      last-move={lastMove}
      orientation={orientation}
      class={className}
      board-label={boardLabel}
      error-message={errorMessage}
    />
  );
};
